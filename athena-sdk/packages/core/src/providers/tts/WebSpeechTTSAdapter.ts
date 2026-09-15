import { TTSProviderAdapter } from '../../types/index.js';

export interface WebSpeechTTSOptions {
  voiceName?: string;
  rate?: number;
  pitch?: number;
  lang?: string;
}

export class WebSpeechTTSAdapter implements TTSProviderAdapter {
  id = 'web-speech-tts';
  name = 'Browser Web Speech API';
  isFallback = true;

  private voiceName?: string;
  private rate: number;
  private pitch: number;
  private lang: number | string;

  constructor(options?: WebSpeechTTSOptions) {
    this.voiceName = options?.voiceName;
    this.rate = options?.rate ?? 1.0;
    this.pitch = options?.pitch ?? 1.0;
    this.lang = options?.lang ?? 'en-US';
  }

  async synthesize(text: string): Promise<string> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      throw new Error('Web Speech API is not supported in this environment.');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;
      utterance.lang = String(this.lang);

      const voices = window.speechSynthesis.getVoices();
      if (this.voiceName) {
        const targetVoice = voices.find((v) => v.name.includes(this.voiceName!));
        if (targetVoice) utterance.voice = targetVoice;
      }

      utterance.onend = () => resolve(text);
      utterance.onerror = (e) => reject(new Error(`WebSpeech TTS Error: ${e.error}`));

      window.speechSynthesis.speak(utterance);
    });
  }
}
