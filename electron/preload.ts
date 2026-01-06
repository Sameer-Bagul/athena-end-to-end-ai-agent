import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("athena", {
  chat: (messages: any[]) => ipcRenderer.invoke("llm:chat", messages),
  tts: (text: string, voiceStyle = "M1") => ipcRenderer.invoke("tts:generate", { text, voiceStyle }),
  transcribe: (buffer: ArrayBuffer) => ipcRenderer.invoke("stt:transcribe", buffer),
  // Chat History
  saveChatHistory: (history: any[]) => ipcRenderer.invoke("chat:save-history", history),
  loadChatHistory: () => ipcRenderer.invoke("chat:load-history"),

  // Window Controls (Widget & Custom Frame)
  // Window Controls (Widget & Custom Frame)
  openWidget: () => ipcRenderer.invoke("widget:open"),
  closeWidget: () => ipcRenderer.invoke("widget:close"),
  minimizeWindow: () => ipcRenderer.invoke("window:minimize"),
  maximizeWindow: () => ipcRenderer.invoke("window:maximize"),
  closeWindow: () => ipcRenderer.invoke("window:close"),
});
