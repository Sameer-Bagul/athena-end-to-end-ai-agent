import { TTSProviderAdapter } from '../../types/index.js';

export interface ElevenLabsOptions {
  apiKey: string;
  voiceId?: string;
  modelId?: string;
}

export class ElevenLabsTTSAdapter implements TTSProviderAdapter {
  id = 'elevenlabs';
  name = 'ElevenLabs';
  isFallback = false;

  private apiKey: string;
  private voiceId: string;
  private modelId: string;

  constructor(options: ElevenLabsOptions) {
    this.apiKey = options.apiKey;
    this.voiceId = options.voiceId || '21m00Tcm4TlvDq8ikWAM'; // Default Rachel voice
    this.modelId = options.modelId || 'eleven_monolingual_v1';
  }

  async synthesize(text: string): Promise<ArrayBuffer> {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: this.modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs API failed [${response.status}]: ${errText}`);
    }

    return await response.arrayBuffer();
  }
}
