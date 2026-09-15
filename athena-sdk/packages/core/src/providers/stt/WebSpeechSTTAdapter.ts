import { STTProviderAdapter } from '../../types/index.js';

export class WebSpeechSTTAdapter implements STTProviderAdapter {
  id = 'web-speech-stt';
  name = 'Browser Speech Recognition';
  isFallback = true;

  private recognition: any = null;
  private isListeningActive = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      }
    }
  }

  startListening(onTranscript: (transcript: string, isFinal: boolean) => void): void {
    if (!this.recognition) {
      throw new Error('Web Speech Recognition API is not supported in this browser.');
    }

    if (this.isListeningActive) return;

    this.isListeningActive = true;
    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        const isFinal = event.results[i].isFinal;
        onTranscript(transcript, isFinal);
      }
    };

    this.recognition.onerror = (e: any) => {
      console.warn('SpeechRecognition error:', e.error);
    };

    this.recognition.onend = () => {
      if (this.isListeningActive) {
        try {
          this.recognition.start();
        } catch (_) {}
      }
    };

    this.recognition.start();
  }

  stopListening(): void {
    this.isListeningActive = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {}
    }
  }
}
