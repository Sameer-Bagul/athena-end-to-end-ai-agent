import { STTProviderAdapter } from '../../types/index.js';

export interface GroqWhisperOptions {
  apiKey: string;
  model?: string;
  language?: string;
}

export class GroqWhisperSTTAdapter implements STTProviderAdapter {
  id = 'groq-whisper';
  name = 'Groq Whisper STT';
  isFallback = false;

  private apiKey: string;
  private model: string;
  private language: string;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor(options: GroqWhisperOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model || 'whisper-large-v3';
    this.language = options.language || 'en';
  }

  async startListening(onTranscript: (transcript: string, isFinal: boolean) => void): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', this.model);
      formData.append('language', this.language);

      try {
        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: formData,
        });

        if (response.ok) {
          const json = await response.json();
          if (json.text) {
            onTranscript(json.text, true);
          }
        }
      } catch (err) {
        console.error('Groq Whisper STT Error:', err);
      }
    };

    this.mediaRecorder.start();
  }

  stopListening(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }
}
