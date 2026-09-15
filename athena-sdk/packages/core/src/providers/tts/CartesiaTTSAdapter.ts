import { TTSProviderAdapter } from '../../types/index.js';

export interface CartesiaOptions {
  apiKey: string;
  voiceId?: string;
  modelId?: string;
}

export class CartesiaTTSAdapter implements TTSProviderAdapter {
  id = 'cartesia';
  name = 'Cartesia Sonic TTS';
  isFallback = false;

  private apiKey: string;
  private voiceId: string;
  private modelId: string;

  constructor(options: CartesiaOptions) {
    this.apiKey = options.apiKey;
    this.voiceId = options.voiceId || 'a0e168ee-3a82-4472-ab3f-ea67510744e0';
    this.modelId = options.modelId || 'sonic-english';
  }

  async synthesize(text: string): Promise<ArrayBuffer> {
    const url = 'https://api.cartesia.ai/tts/bytes';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'Cartesia-Version': '2024-06-10',
      },
      body: JSON.stringify({
        model_id: this.modelId,
        transcript: text,
        voice: {
          mode: 'id',
          id: this.voiceId,
        },
        output_format: {
          container: 'wav',
          encoding: 'pcm_f32le',
          sample_rate: 44100,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Cartesia API failed [${response.status}]: ${errText}`);
    }

    return await response.arrayBuffer();
  }
}
