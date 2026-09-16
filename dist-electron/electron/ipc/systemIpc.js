import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs";
import { ragService } from "../../backend/services/rag.js";
import { systemService } from "../../backend/core/system.js";
import { mcpManager } from "../../backend/services/mcpManager.js";
import { getLocalModelDir, isModelInstalled, deleteModel, NON_OLLAMA_MODELS } from "../../backend/core/modelRegistry.js";
import { downloadFile } from "../../backend/core/downloader.js";
import { getMainWindow, getWidgetWindow, createWidgetWindow } from "../windows/windowManager.js";
const CHAT_FILE = path.join(app.getPath("userData"), "chat-history.json");
export function registerSystemIpcHandlers() {
    // --- Window Controls & State Sync ---
    ipcMain.handle("widget:open", () => {
        createWidgetWindow();
    });
    ipcMain.handle("widget:resize", (_, { width, height }) => {
        const widget = getWidgetWindow();
        if (widget && !widget.isDestroyed()) {
            widget.setSize(width, height);
        }
    });
    ipcMain.handle("widget:close", () => {
        const widget = getWidgetWindow();
        if (widget && !widget.isDestroyed()) {
            widget.close();
        }
    });
    ipcMain.on("sync:broadcast", (_, data) => {
        const widget = getWidgetWindow();
        if (widget && !widget.isDestroyed()) {
            widget.webContents.send("sync:receive", data);
        }
    });
    ipcMain.on("widget:input", (_, data) => {
        const main = getMainWindow();
        if (main && !main.isDestroyed()) {
            main.webContents.send("widget:receive-input", data);
        }
    });
    ipcMain.handle("window:minimize", (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        win?.minimize();
    });
    ipcMain.handle("window:maximize", (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win?.isMaximized())
            win.unmaximize();
        else
            win?.maximize();
    });
    ipcMain.handle("window:close", (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        win?.close();
    });
    // --- RAG Handlers ---
    ipcMain.handle("rag:upload-document", async (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win)
            return { error: "No window found" };
        const result = await dialog.showOpenDialog(win, {
            properties: ['openFile'],
            filters: [{ name: 'Documents', extensions: ['pdf', 'txt', 'md'] }]
        });
        if (result.canceled || result.filePaths.length === 0)
            return { canceled: true };
        try {
            return await ragService.loadDocument(result.filePaths[0]);
        }
        catch (error) {
            console.error("\n\x1b[31m[ERROR]\x1b[0m RAG Upload Error:", error);
            return { error: error.message };
        }
    });
    ipcMain.handle("rag:status", async () => ragService.getStatus());
    ipcMain.handle("rag:clear", async () => {
        ragService.clearContext();
        return { success: true };
    });
    ipcMain.handle("rag:get-context", async (_, input) => ragService.getRelevantContext(input));
    // --- Chat History ---
    ipcMain.handle("chat:save-history", async (_, history) => {
        try {
            fs.writeFileSync(CHAT_FILE, JSON.stringify(history, null, 2));
            return true;
        }
        catch (error) {
            console.error("Failed to save chat history:", error);
            return false;
        }
    });
    ipcMain.handle("chat:load-history", async () => {
        try {
            if (fs.existsSync(CHAT_FILE)) {
                return JSON.parse(fs.readFileSync(CHAT_FILE, "utf-8"));
            }
            return null;
        }
        catch (error) {
            console.error("Failed to load chat history:", error);
            return null;
        }
    });
    // --- Agent Event Bridging ---
    ipcMain.on("agent:add-timer", (_, { duration, unit, label }) => {
        const main = getMainWindow();
        const widget = getWidgetWindow();
        if (main && !main.isDestroyed())
            main.webContents.send("athena:add-timer-ipc", { duration, unit, label });
        if (widget && !widget.isDestroyed())
            widget.webContents.send("athena:add-timer-ipc", { duration, unit, label });
    });
    ipcMain.on("agent:remove-timer", (_, { id }) => {
        const main = getMainWindow();
        const widget = getWidgetWindow();
        if (main && !main.isDestroyed())
            main.webContents.send("athena:remove-timer-ipc", { id });
        if (widget && !widget.isDestroyed())
            widget.webContents.send("athena:remove-timer-ipc", { id });
    });
    ipcMain.handle("agent:call-mcp", async (_, { serverName, toolName, args }) => {
        try {
            return await mcpManager.callTool(serverName, toolName, args);
        }
        catch (error) {
            return { error: error.message };
        }
    });
    // --- System Control ---
    ipcMain.handle("system:get-volume", async () => systemService.getVolume());
    ipcMain.handle("system:set-volume", async (_, percent) => systemService.setVolume(percent));
    ipcMain.handle("system:set-brightness", async (_, percent) => systemService.setBrightness(percent));
    ipcMain.handle("system:get-battery", async () => systemService.getBatteryInfo());
    ipcMain.handle("system:list-files", async (_, targetPath) => systemService.listFiles(targetPath));
    ipcMain.handle("system:read-file", async (_, targetPath) => systemService.readFile(targetPath));
    ipcMain.handle("system:file-stats", async (_, targetPath) => systemService.getFileStats(targetPath));
    // --- Ollama Management ---
    ipcMain.handle("ollama:check-status", async () => {
        try {
            const res = await fetch("http://127.0.0.1:11434/api/tags");
            return { ok: res.ok };
        }
        catch {
            return { ok: false };
        }
    });
    ipcMain.handle("ollama:list-models", async () => {
        try {
            const res = await fetch("http://127.0.0.1:11434/api/tags");
            if (!res.ok)
                throw new Error("Failed to fetch models");
            const data = await res.json();
            return data.models || [];
        }
        catch (e) {
            return { error: e.message };
        }
    });
    ipcMain.handle("ollama:delete-model", async (_, modelName) => {
        try {
            const res = await fetch("http://127.0.0.1:11434/api/delete", {
                method: "DELETE",
                body: JSON.stringify({ name: modelName })
            });
            return { ok: res.ok };
        }
        catch (e) {
            return { error: e.message };
        }
    });
    ipcMain.on("ollama:pull-model", async (event, modelName) => {
        try {
            const response = await fetch("http://localhost:11434/api/pull", {
                method: "POST",
                body: JSON.stringify({ name: modelName, stream: true })
            });
            if (!response.ok || !response.body) {
                event.sender.send("ollama:pull-progress", { model: modelName, status: "error", error: "Connection failed" });
                return;
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value);
                const lines = chunk.split("\n").filter(Boolean);
                for (const line of lines) {
                    try {
                        const json = JSON.parse(line);
                        event.sender.send("ollama:pull-progress", { model: modelName, ...json });
                    }
                    catch { }
                }
            }
        }
        catch (err) {
            event.sender.send("ollama:pull-progress", { model: modelName, status: "error", error: err.message });
        }
    });
    // --- Model Management ---
    ipcMain.handle("model:check-status", async (_, modelId) => {
        return { isInstalled: isModelInstalled(modelId) };
    });
    ipcMain.on("model:pull", async (event, modelId) => {
        const modelDef = NON_OLLAMA_MODELS[modelId];
        if (!modelDef) {
            event.sender.send("model:pull-progress", { model: modelId, status: "error", error: "Model not found in registry" });
            return;
        }
        const modelDir = getLocalModelDir(modelDef.category, modelId);
        try {
            for (const file of modelDef.files) {
                const destPath = path.join(modelDir, file.name);
                if (fs.existsSync(destPath))
                    continue;
                event.sender.send("model:pull-progress", {
                    model: modelId,
                    status: "downloading",
                    detail: `Downloading ${file.name}...`
                });
                await downloadFile(file.url, destPath, (progress) => {
                    event.sender.send("model:pull-progress", {
                        model: modelId,
                        status: "downloading",
                        completed: progress.completed,
                        total: progress.total
                    });
                });
            }
            event.sender.send("model:pull-progress", { model: modelId, status: "success" });
        }
        catch (err) {
            event.sender.send("model:pull-progress", { model: modelId, status: "error", error: err.message });
        }
    });
    ipcMain.handle("model:delete", async (_, modelId) => {
        try {
            return { success: deleteModel(modelId) };
        }
        catch (err) {
            return { error: err.message };
        }
    });
}
