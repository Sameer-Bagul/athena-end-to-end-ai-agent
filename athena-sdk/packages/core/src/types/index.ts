export type ExpressionPreset = 'neutral' | 'happy' | 'angry' | 'sad' | 'relaxed' | 'surprised';

export type EngineStatus = 'idle' | 'initializing' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface VisemeFrame {
  aa: number;
  ih: number;
  ou: number;
  ee: number;
  oh: number;
}

export interface EngineConfig {
  canvas: HTMLCanvasElement;
  avatarUrl: string;
  aiProvider?: AIProviderAdapter;
  ttsProvider?: TTSProviderAdapter;
  sttProvider?: STTProviderAdapter;
  enableFaceTracking?: boolean;
  autoStartListening?: boolean;
}

export interface AIProviderAdapter {
  id: string;
  name: string;
  generateStream(prompt: string, history: ChatMessage[]): AsyncIterable<string>;
  generateResponse(prompt: string, history: ChatMessage[]): Promise<string>;
}

export interface TTSProviderAdapter {
  id: string;
  name: string;
  isFallback?: boolean;
  synthesize(text: string): Promise<AudioBuffer | ArrayBuffer | string>;
}

export interface STTProviderAdapter {
  id: string;
  name: string;
  isFallback?: boolean;
  startListening(onTranscript: (transcript: string, isFinal: boolean) => void): void;
  stopListening(): void;
}

export type EngineEventMap = {
  'status-change': (status: EngineStatus) => void;
  'expression-change': (expression: ExpressionPreset) => void;
  'speech-start': (text: string) => void;
  'speech-end': () => void;
  'transcript': (text: string, isFinal: boolean) => void;
  'warning': (message: string) => void;
  'error': (error: Error) => void;
};
