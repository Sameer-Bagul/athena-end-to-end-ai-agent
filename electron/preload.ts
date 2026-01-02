import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("athena", {
  chat: (messages: any[]) => ipcRenderer.invoke("llm:chat", messages),
  tts: (text: string, voiceStyle = "M1") => ipcRenderer.invoke("tts:generate", { text, voiceStyle }),
  transcribe: (buffer: ArrayBuffer) => ipcRenderer.invoke("stt:transcribe", buffer),
  saveHistory: (history: any[]) => ipcRenderer.invoke("chat:save-history", history),
  loadHistory: () => ipcRenderer.invoke("chat:load-history")
});
