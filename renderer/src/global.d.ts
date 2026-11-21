export interface AthenaAPI {
  chat: (messages: any[]) => Promise<string>;
  tts: (text: string, voiceStyle?: string) => Promise<string>;
  transcribe: (buffer: ArrayBuffer) => Promise<string>;
  getNews: (url: string) => Promise<any>;
  saveChatHistory: (history: any[]) => Promise<boolean>;
  loadChatHistory: () => Promise<any[]>;
  openWidget: () => Promise<void>;
  closeWidget: () => Promise<void>;
  resizeWidget: (width: number, height: number) => Promise<void>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  broadcastState: (data: any) => void;
  onSyncReceive: (callback: (data: any) => void) => () => void;
  sendWidgetInput: (text: string) => void;
  onWidgetInput: (callback: (text: string) => void) => () => void;
  onShortcutEvent: (callback: (type: "pressed" | "released") => void) => () => void;
  rag: {
    uploadDocument: () => Promise<any>;
    getStatus: () => Promise<any>;
    clear: () => Promise<any>;
    getContext: (input: string) => Promise<string>;
  };
  agent: {
    query: (query: string, systemPrompt: string, modelName?: string) => Promise<any>;
    queryStream: (
      queryId: string,
      query: string,
      systemPrompt: string,
      modelName?: string,
      apiKey?: string,
      onToken?: (token: string) => void,
      onProgress?: (msg: string) => void
    ) => Promise<any>;
    onAddTimer: (callback: (data: any) => void) => () => void;
    onRemoveTimer: (callback: (data: any) => void) => () => void;
    onMcpStatus: (callback: (data: any) => void) => () => void;
  };
  ollama: {
    checkStatus: () => Promise<any>;
    listModels: () => Promise<any>;
    pullModel: (name: string) => void;
    onPullProgress: (callback: (data: any) => void) => () => void;
    deleteModel: (name: string) => Promise<any>;
  };
  models: {
    checkStatus: (modelId: string) => Promise<any>;
    pull: (modelId: string) => void;
    delete: (modelId: string) => Promise<any>;
    onProgress: (callback: (data: any) => void) => () => void;
  };
  system: {
    getVolume: () => Promise<any>;
    setVolume: (percent: number) => Promise<any>;
    setBrightness: (percent: number) => Promise<any>;
    getBattery: () => Promise<any>;
    listFiles: (targetPath: string) => Promise<any>;
    readFile: (targetPath: string) => Promise<any>;
    fileStats: (targetPath: string) => Promise<any>;
  };
  log: (...args: any[]) => void;
}

declare global {
  interface Window {
    athena: AthenaAPI;
  }
}

export {};
