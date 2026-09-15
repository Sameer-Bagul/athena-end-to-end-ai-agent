import { VisemeFrame } from '../types/index.js';

export class LipSyncEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private isProcessing = false;

  public currentViseme: VisemeFrame = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };

  constructor() {
    // AudioContext will be initialized on first audio play or user interaction
  }

  private initAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public connectSource(audioElementOrNode: HTMLAudioElement | AudioNode): AnalyserNode {
    const ctx = this.initAudioContext();
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.5;

    if (audioElementOrNode instanceof HTMLAudioElement) {
      const source = ctx.createMediaElementSource(audioElementOrNode);
      source.connect(this.analyser);
      this.analyser.connect(ctx.destination);
    } else {
      audioElementOrNode.connect(this.analyser);
      this.analyser.connect(ctx.destination);
    }

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    return this.analyser;
  }

  public update(): VisemeFrame {
    if (!this.analyser || !this.dataArray) {
      return this.currentViseme;
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    // Frequency spectrum analysis
    // Sub-bass & low formants (100Hz - 400Hz) -> 'oh' / 'ou'
    // Mid formants (500Hz - 1.5kHz) -> 'aa'
    // High formants (1.8kHz - 3.5kHz) -> 'ee' / 'ih'
    
    let lowEnergy = 0;
    let midEnergy = 0;
    let highEnergy = 0;

    const binCount = this.dataArray.length;
    for (let i = 0; i < binCount; i++) {
      const val = this.dataArray[i] / 255.0;
      if (i < binCount * 0.2) {
        lowEnergy += val;
      } else if (i < binCount * 0.6) {
        midEnergy += val;
      } else {
        highEnergy += val;
      }
    }

    lowEnergy /= binCount * 0.2;
    midEnergy /= binCount * 0.4;
    highEnergy /= binCount * 0.4;

    const volume = (lowEnergy + midEnergy + highEnergy) / 3.0;

    if (volume < 0.05) {
      this.currentViseme = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
    } else {
      this.currentViseme = {
        aa: Math.min(1.0, midEnergy * 1.5),
        ih: Math.min(1.0, highEnergy * 1.2),
        ou: Math.min(1.0, lowEnergy * 1.4),
        ee: Math.min(1.0, highEnergy * 1.5),
        oh: Math.min(1.0, (lowEnergy + midEnergy) * 0.8),
      };
    }

    return this.currentViseme;
  }
}
