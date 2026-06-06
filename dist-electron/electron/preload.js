import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("athena", {
    chat: (messages) => ipcRenderer.invoke("llm:chat", messages),
    tts: (text, voiceStyle = "M1") => ipcRenderer.invoke("tts:generate", { text, voiceStyle }),
    transcribe: (buffer) => ipcRenderer.invoke("stt:transcribe", buffer),
    getNews: (url) => ipcRenderer.invoke("tool:news", url),
    // Chat History
    saveChatHistory: (history) => ipcRenderer.invoke("chat:save-history", history),
    loadChatHistory: () => ipcRenderer.invoke("chat:load-history"),
    // Window Controls (Widget & Custom Frame)
    // Window Controls (Widget & Custom Frame)
    openWidget: () => ipcRenderer.invoke("widget:open"),
    closeWidget: () => ipcRenderer.invoke("widget:close"),
    resizeWidget: (width, height) => ipcRenderer.invoke("widget:resize", { width, height }),
    // State Sync
    broadcastState: (data) => ipcRenderer.send("sync:broadcast", data),
    onSyncReceive: (callback) => {
        const subscription = (_, data) => {
            if (Array.isArray(data)) {
                data.forEach(callback);
            }
            else {
                callback(data);
            }
        };
        ipcRenderer.on("sync:receive", subscription);
        ipcRenderer.on("sync:receive-batch", subscription);
        return () => {
            ipcRenderer.removeListener("sync:receive", subscription);
            ipcRenderer.removeListener("sync:receive-batch", subscription);
        };
    },
    // Widget Input Forwarding
    sendWidgetInput: (text) => ipcRenderer.send("widget:input", text),
    onWidgetInput: (callback) => {
        const subscription = (_, text) => callback(text);
        ipcRenderer.on("widget:receive-input", subscription);
        return () => ipcRenderer.removeListener("widget:receive-input", subscription);
    },
    // Window Controls
    minimizeWindow: () => ipcRenderer.invoke("window:minimize"),
    maximizeWindow: () => ipcRenderer.invoke("window:maximize"),
    closeWindow: () => ipcRenderer.invoke("window:close"),
    // Global Shortcut
    onShortcutEvent: (callback) => {
        const subscription = (_, type) => callback('pressed');
        ipcRenderer.on('shortcut:pressed', subscription);
        return () => ipcRenderer.removeListener('shortcut:pressed', subscription);
    },
    // RAG / Knowledge Base
    rag: {
        uploadDocument: () => ipcRenderer.invoke("rag:upload-document"),
        getStatus: () => ipcRenderer.invoke("rag:status"),
        clear: () => ipcRenderer.invoke("rag:clear"),
        getContext: (input) => ipcRenderer.invoke("rag:get-context", input)
    },
    // LangGraph Agent
    agent: {
        query: (query, systemPrompt, modelName) => ipcRenderer.invoke("agent:query", { query, systemPrompt, modelName }),
        queryStream: (queryId, query, systemPrompt, modelName, apiKey, onToken, onProgress) => {
            if (onToken) {
                ipcRenderer.on(`agent:token-${queryId}`, (_, token) => onToken(token));
            }
            if (onProgress) {
                ipcRenderer.on(`agent:progress-${queryId}`, (_, msg) => onProgress(msg));
            }
            return new Promise((resolve) => {
                ipcRenderer.once(`agent:complete-${queryId}`, (_, result) => {
                    ipcRenderer.removeAllListeners(`agent:token-${queryId}`);
                    ipcRenderer.removeAllListeners(`agent:progress-${queryId}`);
                    resolve(result);
                });
                ipcRenderer.send("agent:query-stream", { queryId, query, systemPrompt, modelName, apiKey });
            });
        },
        onAddTimer: (callback) => {
            const subscription = (_, data) => callback(data);
            ipcRenderer.on("athena:add-timer-ipc", subscription);
            return () => ipcRenderer.removeListener("athena:add-timer-ipc", subscription);
        },
        onRemoveTimer: (callback) => {
            const subscription = (_, data) => callback(data);
            ipcRenderer.on("athena:remove-timer-ipc", subscription);
            return () => ipcRenderer.removeListener("athena:remove-timer-ipc", subscription);
        },
        onMcpStatus: (callback) => {
            const subscription = (_, data) => callback(data);
            ipcRenderer.on("agent:mcp-status", subscription);
            return () => ipcRenderer.removeListener("agent:mcp-status", subscription);
        }
    },
    // Ollama Management
    ollama: {
        checkStatus: () => ipcRenderer.invoke("ollama:check-status"),
        listModels: () => ipcRenderer.invoke("ollama:list-models"),
        pullModel: (name) => ipcRenderer.send("ollama:pull-model", name),
        onPullProgress: (callback) => {
            const subscription = (_, data) => callback(data);
            ipcRenderer.on("ollama:pull-progress", subscription);
            return () => ipcRenderer.removeListener("ollama:pull-progress", subscription);
        },
        deleteModel: (name) => ipcRenderer.invoke("ollama:delete-model", name)
    },
    // General Model Management (Whisper/TTS)
    models: {
        checkStatus: (modelId) => ipcRenderer.invoke("model:check-status", modelId),
        pull: (modelId) => ipcRenderer.send("model:pull", modelId),
        delete: (modelId) => ipcRenderer.invoke("model:delete", modelId),
        onProgress: (callback) => {
            const subscription = (_, data) => callback(data);
            ipcRenderer.on("model:pull-progress", subscription);
            return () => ipcRenderer.removeListener("model:pull-progress", subscription);
        }
    },
    // Laptop / System Control
    system: {
        getVolume: () => ipcRenderer.invoke("system:get-volume"),
        setVolume: (percent) => ipcRenderer.invoke("system:set-volume", percent),
        setBrightness: (percent) => ipcRenderer.invoke("system:set-brightness", percent),
        getBattery: () => ipcRenderer.invoke("system:get-battery"),
        listFiles: (targetPath) => ipcRenderer.invoke("system:list-files", targetPath),
        readFile: (targetPath) => ipcRenderer.invoke("system:read-file", targetPath),
        fileStats: (targetPath) => ipcRenderer.invoke("system:file-stats", targetPath)
    },
    // Logging to Main Terminal
    log: (...args) => ipcRenderer.send("logger:log", ...args)
});
