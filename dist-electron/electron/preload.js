"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("athena", {
    chat: (messages) => electron_1.ipcRenderer.invoke("llm:chat", messages),
    tts: (text, voiceStyle = "M1") => electron_1.ipcRenderer.invoke("tts:generate", { text, voiceStyle }),
    transcribe: (buffer) => electron_1.ipcRenderer.invoke("stt:transcribe", buffer),
    saveHistory: (history) => electron_1.ipcRenderer.invoke("chat:save-history", history),
    loadHistory: () => electron_1.ipcRenderer.invoke("chat:load-history")
});
