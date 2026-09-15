import { STTProviderAdapter } from '../../types/index.js';

export interface DeepgramSTTOptions {
  apiKey: string;
  model?: string;
  language?: string;
}

export class DeepgramSTTAdapter implements STTProviderAdapter {
  id = 'deepgram';
  name = 'Deepgram Nova-2 Real-Time STT';
  isFallback = false;

  private apiKey: string;
  private model: string;
  private language: string;
  private mediaRecorder: MediaRecorder | null = null;
  private socket: WebSocket | null = null;

  constructor(options: DeepgramSTTOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model || 'nova-2';
    this.language = options.language || 'en-US';
  }

  async startListening(onTranscript: (transcript: string, isFinal: boolean) => void): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const wsUrl = `wss://api.deepgram.com/v1/listen?model=${this.model}&language=${this.language}&punctuate=true&interim_results=true`;

    this.socket = new WebSocket(wsUrl, ['token', this.apiKey]);

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const alternative = data.channel?.alternatives?.[0];
        if (alternative?.transcript) {
          onTranscript(alternative.transcript, data.is_final || false);
        }
      } catch (_) {}
    };

    this.socket.onopen = () => {
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(e.data);
        }
      };
      this.mediaRecorder.start(250);
    };
  }

  stopListening(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
