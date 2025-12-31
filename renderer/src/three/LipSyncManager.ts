import { VRM } from '@pixiv/three-vrm';

export class LipSyncManager {
    private vrm: VRM | null = null;
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private source: AudioBufferSourceNode | null = null;
    private isPlaying: boolean = false;
    private dataArray: Uint8Array | null = null;

    constructor() {
        // Initialize AudioContext on user interaction usually, but here we prep it
        // We'll lazy init in playAudio to handle browser autoplay policies
    }

    public setVRM(vrm: VRM) {
        this.vrm = vrm;
    }

    public async playAudio(audioBlob: Blob) {
        if (!this.vrm) return;

        // Lazy Init AudioContext
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // Resume if suspended (browser policy)
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // Stop previous audio
        this.stop();

        try {
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            this.source = this.audioContext.createBufferSource();
            this.source.buffer = audioBuffer;

            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            // We want time domain or frequency? Frequency is good for volume.
            // fftSize 256 gives 128 data points.

            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            this.source.onended = () => {
                this.isPlaying = false;
                this.resetMouth();
            };

            this.source.start(0);
            this.isPlaying = true;

        } catch (error) {
            console.error("Error playing audio:", error);
            this.isPlaying = false;
        }
    }

    public stop() {
        if (this.source) {
            try {
                this.source.stop();
            } catch (e) {
                // ignore if already stopped
            }
            this.source.disconnect();
            this.source = null;
        }
        this.isPlaying = false;
        this.resetMouth();
    }

    public update(_delta: number) {
        if (!this.vrm || !this.isPlaying || !this.analyser || !this.dataArray) return;

        // Get volume data
        this.analyser.getByteFrequencyData(this.dataArray as any);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        const average = sum / this.dataArray.length;

        // Map average volume (0-255) to mouth weight (0.0-1.0)
        // Adjust sensitivity as needed. 
        // Typically speech average might be around 30-100?
        // Let's normalize.
        const sensitivity = 2.5; // Multiplier to make mouth open more
        const normalizedVolume = Math.min((average / 128) * sensitivity, 1.0);

        // Apply smooth transition if needed, or direct mapping for crisp response
        // For basic talking, mapping 'aa' is mostly sufficient
        this.setMouthOpen(normalizedVolume);
    }

    private setMouthOpen(weight: number) {
        if (!this.vrm || !this.vrm.expressionManager) return;

        // Blend shape 'aa' is the most common "mouth open" shape
        this.vrm.expressionManager.setValue('aa', weight);

        // Optionally add a little 'ih' or 'oh' for variety if we had frequency analysis
        // For simple volume sync, 'aa' is standard.
    }

    private resetMouth() {
        if (!this.vrm || !this.vrm.expressionManager) return;
        this.vrm.expressionManager.setValue('aa', 0);
        this.vrm.expressionManager.setValue('ih', 0);
        this.vrm.expressionManager.setValue('ou', 0);
        this.vrm.expressionManager.setValue('ee', 0);
        this.vrm.expressionManager.setValue('oh', 0);
    }
}
