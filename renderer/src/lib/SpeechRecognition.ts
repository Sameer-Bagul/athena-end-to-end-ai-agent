
/**
 * SpeechRecognitionManager.ts
 * 
 * Standard "Dumb Client"
 * - Uses MediaRecorder (native, efficient).
 * - Sends raw WebM blob to backend.
 * - No client-side encoding/processing.
 */

export class SpeechRecognitionManager {
    private shouldListen: boolean = false;
    private mediaStream: MediaStream | null = null;
    private recorder: MediaRecorder | null = null;
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private source: MediaStreamAudioSourceNode | null = null;

    private chunks: BlobPart[] = [];

    private silenceCounter: number = 0;
    private isSpeaking: boolean = false;
    private vadInterval: any = null;

    private readonly VAD_THRESHOLD = 30;
    private readonly SILENCE_DURATION = 1500;
    private readonly CHECK_INTERVAL = 100;

    private onResultCallback: ((text: string) => void) | null = null;
    private onSpeechStartCallback: (() => void) | null = null;
    private onStatusChangeCallback: ((status: string) => void) | null = null;
    private onErrorCallback: ((error: string) => void) | null = null;

    private isAborted: boolean = false;
    private mode: 'vad' | 'ptt' = 'vad';

    constructor() {
        console.log('🎤 [SpeechManager] Initialized (Standard WebM Client)');
    }

    public setMode(mode: 'vad' | 'ptt') {
        this.mode = mode;
        console.log(`🎤 [SpeechManager] Mode set to: ${mode}`);
    }

    public async start(callbacks: {
        onResult: (text: string) => void,
        onSpeechStart?: () => void,
        onInterimResult?: (text: string) => void,
        onStatusChange?: (status: string) => void,
        onError?: (error: string) => void
    }) {
        if (this.shouldListen) {
            console.warn('🎤 [SpeechManager] Already listening');
            return;
        }

        console.log(`🎤 [SpeechManager] Starting (Mode: ${this.mode})...`);
        this.shouldListen = true;
        this.isAborted = false;

        this.onResultCallback = callbacks.onResult;
        this.onSpeechStartCallback = callbacks.onSpeechStart || null;
        this.onStatusChangeCallback = callbacks.onStatusChange || null;
        this.onErrorCallback = callbacks.onError || null;

        this.startListeningCycle();
    }

    private async startListeningCycle() {
        if (!this.shouldListen) return;

        try {
            if (this.onStatusChangeCallback) this.onStatusChangeCallback('listening');

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaStream = stream;

            // VAD Setup
            this.audioContext = new AudioContext();
            this.source = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.source.connect(this.analyser);

            // Recorder Setup
            this.chunks = [];
            // Prefer Opus
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            this.recorder = new MediaRecorder(stream, { mimeType });

            this.recorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.chunks.push(e.data);
            };

            this.recorder.onstop = async () => {
                console.log('🎤 [SpeechManager] Recorder stopped. Chunks:', this.chunks.length);
                const blob = new Blob(this.chunks, { type: mimeType });
                this.chunks = [];
                await this.processAudio(blob);
            };

            if (this.mode === 'ptt') {
                // PTT: Start recording immediately
                this.recorder.start();
                if (this.onStatusChangeCallback) this.onStatusChangeCallback('listening-ptt');
            } else {
                // VAD: Start VAD loop
                this.startVAD();
            }

        } catch (e) {
            console.error('🎤 [SpeechManager] Error starting:', e);
            if (this.onErrorCallback) this.onErrorCallback('mic-error');
        }
    }

    private startVAD() {
        this.silenceCounter = 0;
        this.isSpeaking = false;

        this.vadInterval = setInterval(() => {
            if (!this.analyser || !this.shouldListen) return;

            const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(dataArray);

            const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;

            if (volume > this.VAD_THRESHOLD) {
                this.silenceCounter = 0;
                if (!this.isSpeaking) {
                    console.log(`🎤 [VAD] Speech Start (Vol: ${volume.toFixed(1)})`);
                    this.isSpeaking = true;
                    if (this.onSpeechStartCallback) this.onSpeechStartCallback();
                    if (this.onStatusChangeCallback) this.onStatusChangeCallback('hearing');
                    if (this.recorder && this.recorder.state === 'inactive') {
                        this.recorder.start();
                    }
                }
            } else {
                if (this.isSpeaking) {
                    this.silenceCounter += this.CHECK_INTERVAL;
                    if (this.silenceCounter > this.SILENCE_DURATION) {
                        console.log('🎤 [VAD] Speech End');
                        this.isSpeaking = false;
                        if (this.recorder && this.recorder.state === 'recording') {
                            this.recorder.stop();
                        }
                    }
                }
            }
        }, this.CHECK_INTERVAL);
    }

    private async processAudio(blob: Blob) {
        if (this.isAborted) return;
        if (blob.size < 1000) {
            console.log('🎤 [SpeechManager] Input too short');
            return;
        }

        console.log(`🎤 [SpeechManager] Sending WebM blob: ${blob.size} bytes`);
        if (this.onStatusChangeCallback) this.onStatusChangeCallback('processing');

        try {
            const arrayBuffer = await blob.arrayBuffer();
            const text = await window.athena.transcribe(arrayBuffer);
            console.log('📝 [STT Result]:', text);

            if (text && text.trim().length > 0 && !text.startsWith('Error:')) {
                if (this.onResultCallback) this.onResultCallback(text);
            }

            if (this.shouldListen) {
                if (this.onStatusChangeCallback) this.onStatusChangeCallback('listening');
            }
        } catch (error) {
            console.error('STT Error:', error);
            if (this.onStatusChangeCallback) this.onStatusChangeCallback('error');
        }
    }

    public stop(abort: boolean = false) {
        console.log(`🎤 [SpeechManager] Stop called (abort=${abort})`);
        this.shouldListen = false;
        this.isAborted = abort;

        if (this.vadInterval) clearInterval(this.vadInterval);
        if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
        if (this.mediaStream) this.mediaStream.getTracks().forEach(t => t.stop());
        if (this.audioContext) this.audioContext.close();

        if (this.onStatusChangeCallback) this.onStatusChangeCallback('stopped');
    }

    public toggle(callbacks: any) {
        if (this.shouldListen) this.stop();
        else this.start(callbacks);
    }

    public isActive(): boolean {
        return this.shouldListen;
    }
}
