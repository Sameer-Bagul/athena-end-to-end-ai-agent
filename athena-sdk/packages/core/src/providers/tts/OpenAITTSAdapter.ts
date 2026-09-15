import { TTSProviderAdapter } from '../../types/index.js';

export interface OpenAITTSOptions {
  apiKey: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  model?: 'tts-1' | 'tts-1-hd';
}

export class OpenAITTSAdapter implements TTSProviderAdapter {
  id = 'openai-tts';
  name = 'OpenAI Speech TTS';
  isFallback = false;

  private apiKey: string;
  private voice: string;
  private model: string;

  constructor(options: OpenAITTSOptions) {
    this.apiKey = options.apiKey;
    this.voice = options.voice || 'nova';
    this.model = options.model || 'tts-1';
  }

  async synthesize(text: string): Promise<ArrayBuffer> {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
        voice: this.voice,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI TTS Error [${response.status}]: ${errText}`);
    }

    return await response.arrayBuffer();
  }
}
