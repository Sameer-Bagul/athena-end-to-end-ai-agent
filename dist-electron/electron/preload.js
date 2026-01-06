"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("athena", {
    chat: (messages) => electron_1.ipcRenderer.invoke("llm:chat", messages),
    tts: (text, voiceStyle = "M1") => electron_1.ipcRenderer.invoke("tts:generate", { text, voiceStyle }),
    transcribe: (buffer) => electron_1.ipcRenderer.invoke("stt:transcribe", buffer),
    // Chat History
    saveChatHistory: (history) => electron_1.ipcRenderer.invoke("chat:save-history", history),
    loadChatHistory: () => electron_1.ipcRenderer.invoke("chat:load-history"),
    // Window Controls (Widget & Custom Frame)
    // Window Controls (Widget & Custom Frame)
    openWidget: () => electron_1.ipcRenderer.invoke("widget:open"),
    closeWidget: () => electron_1.ipcRenderer.invoke("widget:close"),
    minimizeWindow: () => electron_1.ipcRenderer.invoke("window:minimize"),
    maximizeWindow: () => electron_1.ipcRenderer.invoke("window:maximize"),
    closeWindow: () => electron_1.ipcRenderer.invoke("window:close"),
});
