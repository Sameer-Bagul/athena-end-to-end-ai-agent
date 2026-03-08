"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("athena", {
    chat: (messages) => electron_1.ipcRenderer.invoke("llm:chat", messages),
    tts: (text, voiceStyle = "M1") => electron_1.ipcRenderer.invoke("tts:generate", { text, voiceStyle }),
    transcribe: (buffer) => electron_1.ipcRenderer.invoke("stt:transcribe", buffer),
    getNews: (url) => electron_1.ipcRenderer.invoke("tool:news", url),
    // Chat History
    saveChatHistory: (history) => electron_1.ipcRenderer.invoke("chat:save-history", history),
    loadChatHistory: () => electron_1.ipcRenderer.invoke("chat:load-history"),
    // Window Controls (Widget & Custom Frame)
    // Window Controls (Widget & Custom Frame)
    openWidget: () => electron_1.ipcRenderer.invoke("widget:open"),
    closeWidget: () => electron_1.ipcRenderer.invoke("widget:close"),
    resizeWidget: (width, height) => electron_1.ipcRenderer.invoke("widget:resize", { width, height }),
    // State Sync
    broadcastState: (data) => electron_1.ipcRenderer.send("sync:broadcast", data),
    onSyncReceive: (callback) => {
        const subscription = (_, data) => callback(data);
        electron_1.ipcRenderer.on("sync:receive", subscription);
        return () => electron_1.ipcRenderer.removeListener("sync:receive", subscription);
    },
    // Widget Input Forwarding
    sendWidgetInput: (text) => electron_1.ipcRenderer.send("widget:input", text),
    onWidgetInput: (callback) => {
        const subscription = (_, text) => callback(text);
        electron_1.ipcRenderer.on("widget:receive-input", subscription);
        return () => electron_1.ipcRenderer.removeListener("widget:receive-input", subscription);
    },
    // Window Controls
    minimizeWindow: () => electron_1.ipcRenderer.invoke("window:minimize"),
    maximizeWindow: () => electron_1.ipcRenderer.invoke("window:maximize"),
    closeWindow: () => electron_1.ipcRenderer.invoke("window:close"),
    // Global Shortcut
    onShortcutEvent: (callback) => {
        const subscription = (_, type) => callback('pressed');
        electron_1.ipcRenderer.on('shortcut:pressed', subscription);
        return () => electron_1.ipcRenderer.removeListener('shortcut:pressed', subscription);
    },
    // RAG / Knowledge Base
    rag: {
        uploadDocument: () => electron_1.ipcRenderer.invoke("rag:upload-document"),
        getStatus: () => electron_1.ipcRenderer.invoke("rag:status"),
        clear: () => electron_1.ipcRenderer.invoke("rag:clear"),
        getContext: (input) => electron_1.ipcRenderer.invoke("rag:get-context", input)
    },
    // Ollama Management
    ollama: {
        checkStatus: () => electron_1.ipcRenderer.invoke("ollama:check-status"),
        listModels: () => electron_1.ipcRenderer.invoke("ollama:list-models"),
        pullModel: (name) => electron_1.ipcRenderer.send("ollama:pull-model", name),
        onPullProgress: (callback) => {
            const subscription = (_, data) => callback(data);
            electron_1.ipcRenderer.on("ollama:pull-progress", subscription);
            return () => electron_1.ipcRenderer.removeListener("ollama:pull-progress", subscription);
        },
        deleteModel: (name) => electron_1.ipcRenderer.invoke("ollama:delete-model", name)
    },
    // General Model Management (Whisper/TTS)
    models: {
        checkStatus: (modelId) => electron_1.ipcRenderer.invoke("model:check-status", modelId),
        pull: (modelId) => electron_1.ipcRenderer.send("model:pull", modelId),
        delete: (modelId) => electron_1.ipcRenderer.invoke("model:delete", modelId),
        onProgress: (callback) => {
            const subscription = (_, data) => callback(data);
            electron_1.ipcRenderer.on("model:pull-progress", subscription);
            return () => electron_1.ipcRenderer.removeListener("model:pull-progress", subscription);
        }
    },
    // Logging to Main Terminal
    log: (...args) => electron_1.ipcRenderer.send("logger:log", ...args)
});
