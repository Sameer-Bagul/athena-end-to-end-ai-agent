import { TTSProviderAdapter } from '../../types/index.js';

export interface AzureTTSOptions {
  subscriptionKey: string;
  region: string;
  voiceName?: string;
}

export class AzureTTSAdapter implements TTSProviderAdapter {
  id = 'azure';
  name = 'Azure Cognitive Speech';
  isFallback = false;

  private subscriptionKey: string;
  private region: string;
  private voiceName: string;

  constructor(options: AzureTTSOptions) {
    this.subscriptionKey = options.subscriptionKey;
    this.region = options.region;
    this.voiceName = options.voiceName || 'en-US-JennyNeural';
  }

  async synthesize(text: string): Promise<ArrayBuffer> {
    const url = `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const ssml = `<speak version='1.0' xml:lang='en-US'><voice name='${this.voiceName}'>${text}</voice></speak>`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
      },
      body: ssml,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Azure Speech API failed [${response.status}]: ${errText}`);
    }

    return await response.arrayBuffer();
  }
}
