import { VRM } from '@pixiv/three-vrm';

export class LipSyncManager {
    private vrm: VRM | null = null;
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private source: AudioBufferSourceNode | null = null;
    private isPlaying: boolean = false;
    private dataArray: Uint8Array | null = null;
    private enabled: boolean = true;

    // Vowel Smoothing State
    private currentVowelWeights = {
        aa: 0,
        ih: 0,
        ou: 0,
        ee: 0,
        oh: 0
    };

    private targetVowelWeights = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
    private lastAnalysisTime: number = 0;
    private readonly ANALYSIS_INTERVAL_MS = 50;

    // Lerp factor for smoothing (0.0 = frozen, 1.0 = instant)
    private readonly SMOOTHING_FACTOR = 0.4;
    private readonly SENSITIVITY = 1.0;

    constructor() {
        // Initialize AudioContext on user interaction usually, but here we prep it
        // We'll lazy init in playAudio to handle browser autoplay policies
    }

    public setVRM(vrm: VRM) {
        this.vrm = vrm;
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
        if (!enabled) {
            this.resetMouth(false); // Instant reset when disabled
        }
    }

    public async playAudio(audioBlob: Blob, isMuted: boolean = false): Promise<void> {
        if (!this.vrm) return;

        // Lazy Init AudioContext
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
        }

        // Resume if suspended (browser policy)
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // Stop previous audio
        this.stop();

        return new Promise((resolve) => {
            (async () => {
                try {
                    if (!this.audioContext) return resolve(); // Should not happen

                    const arrayBuffer = await audioBlob.arrayBuffer();
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

                    this.source = this.audioContext.createBufferSource();
                    this.source.buffer = audioBuffer;

                    this.analyser = this.audioContext.createAnalyser();
                    this.analyser.fftSize = 1024; // Higher resolution for frequency analysis
                    this.analyser.smoothingTimeConstant = 0.3;

                    this.source.connect(this.analyser);

                    if (isMuted) {
                        // Route through zero-gain node to mute but keep graph active
                        const gainNode = this.audioContext.createGain();
                        gainNode.gain.value = 0;
                        this.analyser.connect(gainNode);
                        gainNode.connect(this.audioContext.destination);
                    } else {
                        this.analyser.connect(this.audioContext.destination);
                    }

                    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

                    this.source.onended = () => {
                        this.isPlaying = false;
                        this.resetMouth();
                        resolve();
                    };

                    this.source.start(0);
                    this.isPlaying = true;

                } catch (error) {
                    console.error("Error playing audio:", error);
                    this.isPlaying = false;
                    resolve(); // Resolve anyway to unblock queue
                }
            })();
        });
    }

    public stop() {
        if (this.source) {
            try {
                this.source.stop();
            } catch {
                // ignore if already stopped or not started
            }
            this.source.disconnect();
            this.source = null;
        }
        this.isPlaying = false;
        this.resetMouth();
    }

    public update(_delta: number) {
        if (!this.enabled || !this.vrm || !this.isPlaying || !this.analyser || !this.dataArray) {
            // If not playing, decay weights to 0
            if (!this.isPlaying && this.enabled) this.resetMouth(true);
            return;
        }

        const now = performance.now();
        if (now - this.lastAnalysisTime > this.ANALYSIS_INTERVAL_MS) {
            this.lastAnalysisTime = now;

            // Get frequency data
            if (this.dataArray) {
                this.analyser.getByteFrequencyData(this.dataArray as Uint8Array<ArrayBuffer>);
            }

            // Analyze Formant Energy Bands
            const lowEnergy = this.getAverageEnergy(2, 14);
            const midEnergy = this.getAverageEnergy(14, 46);
            const highEnergy = this.getAverageEnergy(46, 140);

            // Total volume factor
            const volume = Math.max(lowEnergy, midEnergy, highEnergy) / 255;
            const isSpeaking = volume > 0.1;

            if (!isSpeaking) {
                this.targetVowelWeights = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
            } else {
                const targets = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };

                const relLow = lowEnergy / 255;
                const relMid = midEnergy / 255;
                const relHigh = highEnergy / 255;

                if (relMid > 0.4 && relHigh > 0.3) targets.aa = (relMid + relHigh) * 0.8;
                if (relLow > 0.5 && relHigh < 0.3) targets.ou = relLow * 1.2;
                if (relHigh > 0.5 && relLow < 0.4) targets.ih = relHigh * 1.1;
                if (relLow > 0.5 && relMid > 0.4) targets.oh = (relLow + relMid) * 0.6;
                if (relMid > 0.4 && relLow > 0.3) targets.ee = relMid * 0.7;

                // Apply Global Sensitivity and Clamp
                Object.keys(targets).forEach((key) => {
                    const k = key as keyof typeof targets;
                    this.targetVowelWeights[k] = Math.min(targets[k] * this.SENSITIVITY, 1.0);
                });
            }
        }

        // Apply Smoothing (Lerp) - Happens every frame at 60Hz
        this.currentVowelWeights.aa = this.lerp(this.currentVowelWeights.aa, this.targetVowelWeights.aa, this.SMOOTHING_FACTOR);
        this.currentVowelWeights.ih = this.lerp(this.currentVowelWeights.ih, this.targetVowelWeights.ih, this.SMOOTHING_FACTOR);
        this.currentVowelWeights.ou = this.lerp(this.currentVowelWeights.ou, this.targetVowelWeights.ou, this.SMOOTHING_FACTOR);
        this.currentVowelWeights.ee = this.lerp(this.currentVowelWeights.ee, this.targetVowelWeights.ee, this.SMOOTHING_FACTOR);
        this.currentVowelWeights.oh = this.lerp(this.currentVowelWeights.oh, this.targetVowelWeights.oh, this.SMOOTHING_FACTOR);

        // Apply to VRM
        this.applyWeights();
    }

    private getAverageEnergy(startBin: number, endBin: number): number {
        if (!this.dataArray) return 0;
        let sum = 0;
        for (let i = startBin; i < endBin; i++) {
            sum += this.dataArray[i];
        }
        return sum / (endBin - startBin);
    }

    private applyWeights() {
        if (!this.vrm || !this.vrm.expressionManager) return;
        const em = this.vrm.expressionManager;
        em.setValue('aa', this.currentVowelWeights.aa);
        em.setValue('ih', this.currentVowelWeights.ih);
        em.setValue('ou', this.currentVowelWeights.ou);
        em.setValue('ee', this.currentVowelWeights.ee);
        em.setValue('oh', this.currentVowelWeights.oh);
    }

    private resetMouth(decay: boolean = false) {
        if (!this.vrm || !this.vrm.expressionManager) return;

        this.targetVowelWeights = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };

        if (decay) {
            // Smoothly decay to zero (for pauses between words)
            const decayFactor = 0.2;
            this.currentVowelWeights.aa = this.lerp(this.currentVowelWeights.aa, 0, decayFactor);
            this.currentVowelWeights.ih = this.lerp(this.currentVowelWeights.ih, 0, decayFactor);
            this.currentVowelWeights.ou = this.lerp(this.currentVowelWeights.ou, 0, decayFactor);
            this.currentVowelWeights.ee = this.lerp(this.currentVowelWeights.ee, 0, decayFactor);
            this.currentVowelWeights.oh = this.lerp(this.currentVowelWeights.oh, 0, decayFactor);
            this.applyWeights();
        } else {
            // Instant hard reset (for stop/end)
            this.currentVowelWeights = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
            const em = this.vrm.expressionManager;
            em.setValue('aa', 0);
            em.setValue('ih', 0);
            em.setValue('ou', 0);
            em.setValue('ee', 0);
            em.setValue('oh', 0);
        }
    }

    private lerp(start: number, end: number, factor: number): number {
        return start + (end - start) * factor;
    }
}
