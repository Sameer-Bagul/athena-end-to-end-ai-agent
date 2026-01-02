/**
 * SpeechRecognitionManager.ts
 * 
 * CLIENT-SIDE WHISPER IMPLEMENTATION (WASM)
 * 
 * Replaces External Python Server with @xenova/transformers via Web Worker.
 */

export class SpeechRecognitionManager {
    private shouldListen: boolean = false; // Intention to listen
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private mediaStream: MediaStream | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private processor: ScriptProcessorNode | null = null;

    private worker: Worker | null = null;
    private isWorkerReady: boolean = false;

    // VAD State
    private silenceCounter: number = 0;
    private isSpeaking: boolean = false;
    private audioBuffer: Float32Array[] = [];
    private recordingLength: number = 0;

    // Configuration
    private readonly VAD_THRESHOLD = 45; // 0-255 (Analysed Byte Data) - Increased to filter noise
    private readonly SILENCE_DURATION = 1500; // ms
    private readonly SAMPLE_RATE = 16000; // Whisper requires 16k
    private readonly CHECK_INTERVAL = 100; // VAD check interval
    private readonly MIN_SPEECH_SAMPLES = 8000; // 0.5s @ 16kHz

    // Callbacks
    private onResultCallback: ((text: string) => void) | null = null;
    private onSpeechStartCallback: (() => void) | null = null;
    private onStatusChangeCallback: ((status: string) => void) | null = null;
    private onErrorCallback: ((error: string) => void) | null = null;

    private vadInterval: any = null;

    constructor() {
        console.log('🎤 [Client Whisper] Initializing...');
        this.initWorker();
    }

    private initWorker() {
        // Initialize Web Worker
        this.worker = new Worker(new URL('../workers/stt-worker.ts', import.meta.url), { type: 'module' });

        this.worker.onmessage = (event) => {
            const { status, text, error } = event.data;
            console.log('👷 [Worker]', status, text || '', error || '');

            if (status === 'ready') {
                this.isWorkerReady = true;
                if (this.onStatusChangeCallback) this.onStatusChangeCallback('ready');
            }
            if (status === 'complete') {
                console.log('📝 [STT Result]:', text);
                if (this.onStatusChangeCallback) this.onStatusChangeCallback('processing');
                if (text && text.trim().length > 0) {
                    if (this.onResultCallback) this.onResultCallback(text);
                }
            }
            if (status === 'error') {
                if (this.onStatusChangeCallback) this.onStatusChangeCallback(`error: ${error}`);
            }
        };

        // Trigger Model Load
        this.worker.postMessage({ type: 'load' });
    }

    public async start(callbacks: {
        onResult: (text: string) => void,
        onSpeechStart?: () => void,
        onInterimResult?: (text: string) => void,
        onStatusChange?: (status: string) => void,
        onError?: (error: string) => void
    }) {
        if (this.shouldListen) return;

        this.shouldListen = true;
        this.onResultCallback = callbacks.onResult;
        this.onSpeechStartCallback = callbacks.onSpeechStart || null;
        this.onStatusChangeCallback = callbacks.onStatusChange || null;
        this.onErrorCallback = callbacks.onError || null;

        if (!this.isWorkerReady && this.onStatusChangeCallback) {
            this.onStatusChangeCallback('loading-model');
        }

        this.startListeningCycle();
    }

    private async startListeningCycle() {
        if (!this.shouldListen) return;

        try {
            if (this.onStatusChangeCallback) this.onStatusChangeCallback('listening');

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaStream = stream;

            // Audio Context for VAD and Capture (Resampled to 16k)
            this.audioContext = new AudioContext({ sampleRate: this.SAMPLE_RATE });
            this.source = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;

            // ScriptProcessor for Raw Audio Capture (Deprecated but widely supported for this use)
            // Ideally AudioWorklet, but Processor is easier for quick impl.
            const bufferSize = 4096;
            this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

            this.source.connect(this.analyser);
            this.source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

            this.audioBuffer = [];
            this.recordingLength = 0;

            this.processor.onaudioprocess = (e) => {
                if (!this.isSpeaking) return; // Only buffer when speaking? 
                // Actually we might want a rolling buffer for "pre-speech". 
                // For now, simpler: Only buffer when "isSpeaking" is true.

                const inputData = e.inputBuffer.getChannelData(0);
                // Clone the data (Float32Array)
                const data = new Float32Array(inputData);
                this.audioBuffer.push(data);
                this.recordingLength += data.length;
            };

            this.startVAD();

        } catch (e) {
            console.error('🎤 [Client Whisper] Error:', e);
            if (this.onErrorCallback) this.onErrorCallback('mic-error');
        }
    }

    private startVAD() {
        this.silenceCounter = 0;
        this.isSpeaking = false;

        this.vadInterval = setInterval(() => {
            if (!this.analyser) return;

            const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(dataArray);

            // Avg Volume
            const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;

            if (volume > this.VAD_THRESHOLD) {
                // Speech Detected
                this.silenceCounter = 0;
                if (!this.isSpeaking) {
                    console.log('🎤 [VAD] Speech Start');
                    this.isSpeaking = true;
                    this.audioBuffer = []; // Reset buffer
                    this.recordingLength = 0;

                    if (this.onSpeechStartCallback) this.onSpeechStartCallback();
                    if (this.onStatusChangeCallback) this.onStatusChangeCallback('hearing');
                }
            } else {
                // Silence
                if (this.isSpeaking) {
                    this.silenceCounter += this.CHECK_INTERVAL;
                    if (this.silenceCounter > this.SILENCE_DURATION) {
                        console.log('🎤 [VAD] Speech End');
                        this.isSpeaking = false;
                        this.processAudio();
                    }
                }
            }
        }, this.CHECK_INTERVAL);
    }

    private processAudio() {
        if (this.recordingLength === 0 || !this.worker) return;

        // Debug: Check Sample Rate & Amplitude
        const realSampleRate = this.audioContext?.sampleRate;
        console.log(`🎤 [AudioDebug] Context SampleRate: ${realSampleRate}Hz (Target: ${this.SAMPLE_RATE}Hz)`);

        // Filter short bursts (noise)
        if (this.recordingLength < this.MIN_SPEECH_SAMPLES) {
            console.log(`🎤 [VAD] Ignored short speech (${(this.recordingLength / this.SAMPLE_RATE).toFixed(2)}s)`);
            return;
        }

        if (this.onStatusChangeCallback) this.onStatusChangeCallback('processing');

        // Flatten Float32Array chunks into one
        const flatBuffer = new Float32Array(this.recordingLength);
        let offset = 0;
        for (const chunk of this.audioBuffer) {
            flatBuffer.set(chunk, offset);
            offset += chunk.length;
        }

        // Send to Worker
        let maxVal = 0;
        for (let i = 0; i < flatBuffer.length; i++) {
            const val = Math.abs(flatBuffer[i]);
            if (val > maxVal) maxVal = val;
        }
        console.log(`🎤 [AudioDebug] Buffer Len: ${flatBuffer.length}, Max Amplitude: ${maxVal.toFixed(4)}`);

        if (maxVal === 0) {
            console.warn('🎤 [AudioDebug] WARNING: Buffer is completely silent!');
        }

        this.worker.postMessage({
            type: 'transcribe',
            audio: flatBuffer
        });
    }

    public stop() {
        this.shouldListen = false;
        if (this.vadInterval) clearInterval(this.vadInterval);

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        if (this.onStatusChangeCallback) this.onStatusChangeCallback('stopped');
    }

    public toggle(callbacks: any) {
        if (this.shouldListen) {
            this.stop();
        } else {
            this.start(callbacks);
        }
    }

    public isActive(): boolean {
        return this.shouldListen;
    }
}
