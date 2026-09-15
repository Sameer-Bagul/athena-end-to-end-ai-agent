import { AthenaScene } from '../three/AthenaScene.js';
import { LipSyncEngine } from '../audio/LipSyncEngine.js';
import {
  EngineConfig,
  EngineStatus,
  EngineEventMap,
  AIProviderAdapter,
  TTSProviderAdapter,
  STTProviderAdapter,
  ChatMessage,
  ExpressionPreset,
} from '../types/index.js';
import { WebSpeechTTSAdapter } from '../providers/tts/WebSpeechTTSAdapter.js';
import { WebSpeechSTTAdapter } from '../providers/stt/WebSpeechSTTAdapter.js';
import { GeminiAdapter } from '../providers/ai/GeminiAdapter.js';

import { FaceTracker } from '../tracking/FaceTracker.js';

export class AthenaEngine {
  public scene: AthenaScene;
  public lipSync: LipSyncEngine;
  public faceTracker: FaceTracker;

  private aiProvider: AIProviderAdapter;
  private ttsProvider: TTSProviderAdapter;
  private sttProvider: STTProviderAdapter;

  private status: EngineStatus = 'idle';
  private chatHistory: ChatMessage[] = [];
  private listeners: Map<keyof EngineEventMap, Set<Function>> = new Map();
  private audioElement: HTMLAudioElement | null = null;

  constructor(config: EngineConfig) {
    this.scene = new AthenaScene(config.canvas);
    this.lipSync = new LipSyncEngine();
    this.faceTracker = new FaceTracker();

    // Default AI Provider
    this.aiProvider = config.aiProvider || new GeminiAdapter({ apiKey: '' });

    // Voice Provider Setup with Browser Fallback Policy
    if (config.ttsProvider) {
      this.ttsProvider = config.ttsProvider;
    } else {
      this.ttsProvider = new WebSpeechTTSAdapter();
      setTimeout(() => {
        this.emit('warning', '⚠️ Using basic browser speech fallback. Attach an ElevenLabs or OpenAI API key for realistic voice.');
      }, 500);
    }

    if (config.sttProvider) {
      this.sttProvider = config.sttProvider;
    } else {
      this.sttProvider = new WebSpeechSTTAdapter();
    }
  }

  public async init(avatarUrl: string): Promise<void> {
    this.setStatus('initializing');
    try {
      await this.scene.loadAvatar(avatarUrl);
      this.setStatus('idle');
    } catch (err) {
      this.setStatus('error');
      this.emit('error', err as Error);
    }
  }

  public async playAnimation(vrmaUrl: string): Promise<void> {
    await this.scene.playVRMA(vrmaUrl);
  }

  public async say(text: string): Promise<void> {
    this.setStatus('speaking');
    this.scene.setExpression('happy');
    this.emit('speech-start', text);

    try {
      const audioResult = await this.ttsProvider.synthesize(text);

      if (typeof audioResult === 'string') {
        // Text / WebSpeech synthesis finished
        this.onSpeechEnd();
      } else if (audioResult instanceof ArrayBuffer) {
        // Binary audio buffer (e.g. ElevenLabs / OpenAI TTS)
        const blob = new Blob([audioResult], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        
        if (!this.audioElement) {
          this.audioElement = new Audio();
          this.lipSync.connectSource(this.audioElement);
        }

        this.audioElement.src = url;
        this.audioElement.onended = () => {
          this.onSpeechEnd();
        };

        // Start viseme lip sync update loop
        const lipSyncInterval = setInterval(() => {
          if (this.status !== 'speaking') {
            clearInterval(lipSyncInterval);
            return;
          }
          const visemes = this.lipSync.update();
          this.scene.applyVisemes(visemes);
        }, 30);

        await this.audioElement.play();
      }
    } catch (error) {
      this.emit('error', error as Error);
      this.onSpeechEnd();
    }
  }

  public async ask(userPrompt: string): Promise<string> {
    this.chatHistory.push({ role: 'user', content: userPrompt });
    this.setStatus('thinking');
    this.scene.setExpression('neutral');

    try {
      let fullResponse = '';
      const stream = this.aiProvider.generateStream(userPrompt, this.chatHistory);

      for await (const chunk of stream) {
        fullResponse += chunk;
      }

      this.chatHistory.push({ role: 'assistant', content: fullResponse });
      await this.say(fullResponse);
      return fullResponse;
    } catch (err) {
      this.setStatus('error');
      this.emit('error', err as Error);
      return 'Sorry, I encountered an error answering that.';
    }
  }

  public listen(): void {
    this.setStatus('listening');
    this.sttProvider.startListening((transcript, isFinal) => {
      this.emit('transcript', transcript, isFinal);
      if (isFinal && transcript.trim()) {
        this.sttProvider.stopListening();
        this.ask(transcript);
      }
    });
  }

  public setEmotion(expression: ExpressionPreset): void {
    this.scene.setExpression(expression);
    this.emit('expression-change', expression);
  }

  public async startFaceTracking(): Promise<void> {
    await this.faceTracker.startTracking((pose) => {
      this.scene.updateHeadPose(pose);
    });
  }

  public stopFaceTracking(): void {
    this.faceTracker.stopTracking();
  }

  public async loadCustomAvatarFile(file: File): Promise<void> {
    const url = URL.createObjectURL(file);
    await this.init(url);
  }

  private onSpeechEnd(): void {
    this.setStatus('idle');
    this.scene.setExpression('neutral');
    this.scene.applyVisemes({ aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 });
    this.emit('speech-end');
  }

  private setStatus(newStatus: EngineStatus): void {
    this.status = newStatus;
    this.emit('status-change', newStatus);
  }

  public on<K extends keyof EngineEventMap>(event: K, fn: EngineEventMap[K]): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(fn);
  }

  public off<K extends keyof EngineEventMap>(event: K, fn: EngineEventMap[K]): void {
    this.listeners.get(event)?.delete(fn);
  }

  private emit<K extends keyof EngineEventMap>(event: K, ...args: Parameters<EngineEventMap[K]>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((fn) => (fn as any)(...args));
    }
  }

  public getStatus(): EngineStatus {
    return this.status;
  }

  public destroy(): void {
    this.stopFaceTracking();
    this.scene.dispose();
    this.sttProvider.stopListening();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
  }
}
