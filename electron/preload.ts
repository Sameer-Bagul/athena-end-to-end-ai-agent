import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("athena", {
  chat: (messages: any[]) => ipcRenderer.invoke("llm:chat", messages),
  tts: (text: string, voiceStyle = "M1") => ipcRenderer.invoke("tts:generate", { text, voiceStyle }),
  transcribe: (buffer: ArrayBuffer) => ipcRenderer.invoke("stt:transcribe", buffer),
  getNews: (url: string) => ipcRenderer.invoke("tool:news", url),
  // Chat History
  saveChatHistory: (history: any[]) => ipcRenderer.invoke("chat:save-history", history),
  loadChatHistory: () => ipcRenderer.invoke("chat:load-history"),

  // Window Controls (Widget & Custom Frame)
  // Window Controls (Widget & Custom Frame)
  openWidget: () => ipcRenderer.invoke("widget:open"),
  closeWidget: () => ipcRenderer.invoke("widget:close"),
  resizeWidget: (width: number, height: number) => ipcRenderer.invoke("widget:resize", { width, height }),

  // State Sync
  broadcastState: (data: any) => ipcRenderer.send("sync:broadcast", data),
  onSyncReceive: (callback: (data: any) => void) => {
    const subscription = (_: any, data: any) => callback(data);
    ipcRenderer.on("sync:receive", subscription);
    return () => ipcRenderer.removeListener("sync:receive", subscription);
  },

  // Widget Input Forwarding
  sendWidgetInput: (text: string) => ipcRenderer.send("widget:input", text),
  onWidgetInput: (callback: (text: string) => void) => {
    const subscription = (_: any, text: any) => callback(text);
    ipcRenderer.on("widget:receive-input", subscription);
    return () => ipcRenderer.removeListener("widget:receive-input", subscription);
  },

  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke("window:minimize"),
  maximizeWindow: () => ipcRenderer.invoke("window:maximize"),
  closeWindow: () => ipcRenderer.invoke("window:close"),

  // Global Shortcut
  onShortcutEvent: (callback: (type: 'pressed' | 'released') => void) => {
    const subscription = (_: any, type: any) => callback('pressed');
    ipcRenderer.on('shortcut:pressed', subscription);
    return () => ipcRenderer.removeListener('shortcut:pressed', subscription);
  },

  // RAG / Knowledge Base
  rag: {
    uploadDocument: () => ipcRenderer.invoke("rag:upload-document"),
    getStatus: () => ipcRenderer.invoke("rag:status"),
    clear: () => ipcRenderer.invoke("rag:clear"),
    getContext: (input: string) => ipcRenderer.invoke("rag:get-context", input)
  },

  // LangGraph Agent
  agent: {
    query: (query: string, systemPrompt: string, modelName?: string) =>
      ipcRenderer.invoke("agent:query", { query, systemPrompt, modelName }),
    queryStream: (queryId: string, query: string, systemPrompt: string, modelName?: string, onToken?: (token: string) => void, onProgress?: (msg: string) => void) => {
      if (onToken) {
        ipcRenderer.on(`agent:token-${queryId}`, (_: any, token: string) => onToken(token));
      }
      if (onProgress) {
        ipcRenderer.on(`agent:progress-${queryId}`, (_: any, msg: string) => onProgress(msg));
      }
      return new Promise((resolve) => {
        ipcRenderer.once(`agent:complete-${queryId}`, (_: any, result: any) => {
          ipcRenderer.removeAllListeners(`agent:token-${queryId}`);
          ipcRenderer.removeAllListeners(`agent:progress-${queryId}`);
          resolve(result);
        });
        ipcRenderer.send("agent:query-stream", { queryId, query, systemPrompt, modelName });
      });
    },
    onAddTimer: (callback: (data: any) => void) => {
      const subscription = (_: any, data: any) => callback(data);
      ipcRenderer.on("athena:add-timer-ipc", subscription);
      return () => ipcRenderer.removeListener("athena:add-timer-ipc", subscription);
    },
    onRemoveTimer: (callback: (data: any) => void) => {
      const subscription = (_: any, data: any) => callback(data);
      ipcRenderer.on("athena:remove-timer-ipc", subscription);
      return () => ipcRenderer.removeListener("athena:remove-timer-ipc", subscription);
    },
    onMcpStatus: (callback: (data: any) => void) => {
      const subscription = (_: any, data: any) => callback(data);
      ipcRenderer.on("agent:mcp-status", subscription);
      return () => ipcRenderer.removeListener("agent:mcp-status", subscription);
    }
  },

  // Ollama Management
  ollama: {
    checkStatus: () => ipcRenderer.invoke("ollama:check-status"),
    listModels: () => ipcRenderer.invoke("ollama:list-models"),
    pullModel: (name: string) => ipcRenderer.send("ollama:pull-model", name),
    onPullProgress: (callback: (data: any) => void) => {
      const subscription = (_: any, data: any) => callback(data);
      ipcRenderer.on("ollama:pull-progress", subscription);
      return () => ipcRenderer.removeListener("ollama:pull-progress", subscription);
    },
    deleteModel: (name: string) => ipcRenderer.invoke("ollama:delete-model", name)
  },

  // General Model Management (Whisper/TTS)
  models: {
    checkStatus: (modelId: string) => ipcRenderer.invoke("model:check-status", modelId),
    pull: (modelId: string) => ipcRenderer.send("model:pull", modelId),
    delete: (modelId: string) => ipcRenderer.invoke("model:delete", modelId),
    onProgress: (callback: (data: any) => void) => {
      const subscription = (_: any, data: any) => callback(data);
      ipcRenderer.on("model:pull-progress", subscription);
      return () => ipcRenderer.removeListener("model:pull-progress", subscription);
    }
  },

  // Laptop / System Control
  system: {
    getVolume: () => ipcRenderer.invoke("system:get-volume"),
    setVolume: (percent: number) => ipcRenderer.invoke("system:set-volume", percent),
    setBrightness: (percent: number) => ipcRenderer.invoke("system:set-brightness", percent),
    getBattery: () => ipcRenderer.invoke("system:get-battery"),
    listFiles: (targetPath: string) => ipcRenderer.invoke("system:list-files", targetPath),
    readFile: (targetPath: string) => ipcRenderer.invoke("system:read-file", targetPath),
    fileStats: (targetPath: string) => ipcRenderer.invoke("system:file-stats", targetPath)
  },

  // Logging to Main Terminal
  log: (...args: any[]) => ipcRenderer.send("logger:log", ...args)
});
