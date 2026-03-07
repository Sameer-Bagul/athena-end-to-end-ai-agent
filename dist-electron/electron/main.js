"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
require("dotenv/config");
const llm_1 = require("../backend/llm");
const tts_1 = require("../backend/tts");
const stt_1 = require("../backend/stt");
const rag_1 = require("../backend/rag");
const electron_2 = require("electron");
const isDev = process.env.NODE_ENV === "development";
// Hack to try and unblock Google Speech API in Electron
process.env.GOOGLE_API_KEY = "ignore";
// Disable sandbox on Linux
if (process.platform === "linux") {
    electron_1.app.commandLine.appendSwitch("no-sandbox");
}
let pythonServerProcess = null;
function startPythonServer() {
    const projectRoot = electron_1.app.getAppPath();
    const pythonBin = path_1.default.join(projectRoot, "services", "stt-env", "bin", "python");
    const scriptPath = path_1.default.join(projectRoot, "services", "whisper-fast", "server.py");
    console.log("🚀 [Electron] Starting Python Server...");
    console.log("   Bin:", pythonBin);
    console.log("   Script:", scriptPath);
    if (!fs_1.default.existsSync(pythonBin)) {
        console.error("❌ [Electron] Python executable not found at:", pythonBin);
        return;
    }
    if (!fs_1.default.existsSync(scriptPath)) {
        console.error("❌ [Electron] Python script not found at:", scriptPath);
        return;
    }
    pythonServerProcess = (0, child_process_1.spawn)(pythonBin, [scriptPath], {
        stdio: "pipe",
        cwd: path_1.default.join(projectRoot, "services")
    });
    pythonServerProcess.stdout.on("data", (data) => {
        console.log(`🐍 [Python] ${data.toString().trim()}`);
    });
    pythonServerProcess.stderr.on("data", (data) => {
        console.error(`🐍 [Python ERROR] ${data.toString().trim()}`);
    });
    pythonServerProcess.on("close", (code) => {
        console.log(`🛑 [Electron] Python server exited with code ${code}`);
    });
    pythonServerProcess.on("error", (err) => {
        console.error("❌ [Electron] Failed to start Python server:", err);
    });
}
let ttsServerProcess = null;
function startTTSServer() {
    const projectRoot = electron_1.app.getAppPath();
    // TTS Service Path
    const ttsServicePath = path_1.default.join(projectRoot, "services", "TTS-supertonic");
    const ttsScript = path_1.default.join(ttsServicePath, "src", "server.js");
    console.log("🚀 [Electron] Starting TTS Server...");
    console.log("   Script:", ttsScript);
    if (!fs_1.default.existsSync(ttsScript)) {
        console.error("❌ [Electron] TTS script not found at:", ttsScript);
        return;
    }
    // We use the same 'node' binary that runs Electron? 
    // No, Electron's node might differ. Safer to assume system 'node' or try to find one.
    // For standard user install, 'node' in path is best bet.
    // OR we can rely on `process.execPath` if it wasn't packaged? 
    // Let's use simple 'node' for now, assuming dev env. 
    ttsServerProcess = (0, child_process_1.spawn)("node", [ttsScript], {
        stdio: "pipe",
        cwd: ttsServicePath // Critical for relative imports/models in TTS
    });
    ttsServerProcess.stdout.on("data", (data) => {
        console.log(`🗣️ [TTS] ${data.toString().trim()}`);
    });
    ttsServerProcess.stderr.on("data", (data) => {
        console.error(`🗣️ [TTS ERROR] ${data.toString().trim()}`);
    });
    ttsServerProcess.on("close", (code) => {
        console.log(`🛑 [Electron] TTS server exited with code ${code}`);
    });
    ttsServerProcess.on("error", (err) => {
        console.error("❌ [Electron] Failed to start TTS server:", err);
    });
}
// Main Window Reference
let mainWindow = null;
let widgetWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1920,
        height: 1080,
        backgroundColor: "#0b0b0b",
        icon: path_1.default.join(__dirname, isDev ? "../../renderer/public/icon.png" : "../../renderer/dist/icon.png"),
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            sandbox: false
        }
    });
    if (isDev) {
        mainWindow.loadURL("http://localhost:5173");
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, "../../renderer/dist/index.html"));
    }
    // Broaden permission handler
    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowed = ['media', 'audioCapture', 'videoCapture', 'camera', 'microphone'];
        if (allowed.includes(permission)) {
            callback(true);
        }
        else {
            callback(false);
        }
    });
    // Logging IPC for debugging renderer in terminal
    electron_1.ipcMain.on("logger:log", (event, ...args) => {
        console.log("🖥️ [Renderer]", ...args);
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
        // If main window closes, close widget too? Usually yes for this app.
        if (widgetWindow) {
            widgetWindow.close();
        }
    });
    // Auto-Open Widget on Minimize
    mainWindow.on('minimize', () => {
        createWidgetWindow();
    });
    // Auto-Close Widget on Restore (Optional, but good UX for "Companion Mode")
    mainWindow.on('restore', () => {
        if (widgetWindow && !widgetWindow.isDestroyed()) {
            widgetWindow.close();
        }
    });
}
function createWidgetWindow() {
    if (widgetWindow) {
        widgetWindow.focus();
        return;
    }
    widgetWindow = new electron_1.BrowserWindow({
        width: 300,
        height: 300,
        minWidth: 200,
        minHeight: 200,
        backgroundColor: "#00000000",
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: false,
        resizable: true,
        icon: path_1.default.join(__dirname, isDev ? "../../renderer/public/icon.png" : "../../renderer/dist/icon.png"),
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            sandbox: false
        }
    });
    // Load same URL but with hash
    if (isDev) {
        widgetWindow.loadURL("http://localhost:5173/#widget");
    }
    else {
        widgetWindow.loadFile(path_1.default.join(__dirname, "../../renderer/dist/index.html"), { hash: 'widget' });
    }
    widgetWindow.on('closed', () => {
        widgetWindow = null;
    });
    // Grant permissions
    widgetWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowed = ['media', 'audioCapture', 'videoCapture', 'camera', 'microphone'];
        if (allowed.includes(permission))
            callback(true);
        else
            callback(false);
    });
}
electron_1.ipcMain.handle("widget:open", () => {
    createWidgetWindow();
});
// Receiver (Widget) -> forwards to Main
electron_1.ipcMain.handle("widget:resize", (event, { width, height }) => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
        widgetWindow.setSize(width, height);
    }
});
electron_1.ipcMain.handle("widget:close", () => {
    if (widgetWindow) {
        widgetWindow.close();
    }
});
// IPC Handler for Sync Broadcasting
// Receiver (Main) -> forwards to Widget
electron_1.ipcMain.on("sync:broadcast", (event, data) => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
        widgetWindow.webContents.send("sync:receive", data);
    }
});
// Receiver (Widget) -> forwards to Main
electron_1.ipcMain.on("widget:input", (event, data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("widget:receive-input", data);
    }
});
// Window Controls (Legacy/Shared)
electron_1.ipcMain.handle("window:minimize", (event) => {
    const win = electron_1.BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
});
electron_1.ipcMain.handle("window:maximize", (event) => {
    const win = electron_1.BrowserWindow.fromWebContents(event.sender);
    if (win?.isMaximized())
        win.unmaximize();
    else
        win?.maximize();
});
electron_1.ipcMain.handle("window:close", (event) => {
    const win = electron_1.BrowserWindow.fromWebContents(event.sender);
    win?.close();
});
// IPC handlers for LLM and TTS
electron_1.ipcMain.handle("llm:chat", async (_, messages) => {
    return await (0, llm_1.chatWithLLM)(messages);
});
// RAG Handlers
electron_1.ipcMain.handle("rag:upload-document", async (event) => {
    const win = electron_1.BrowserWindow.fromWebContents(event.sender);
    if (!win)
        return { error: "No window found" };
    const result = await electron_2.dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: [
            { name: 'Documents', extensions: ['pdf', 'txt', 'md'] }
        ]
    });
    if (result.canceled || result.filePaths.length === 0)
        return { canceled: true };
    try {
        const uploadResult = await rag_1.ragService.loadDocument(result.filePaths[0]);
        return uploadResult;
    }
    catch (error) {
        console.error("❌ [Electron] RAG Upload Error:", error);
        return { error: error.message };
    }
});
electron_1.ipcMain.handle("rag:status", async () => {
    return rag_1.ragService.getStatus();
});
electron_1.ipcMain.handle("rag:clear", async () => {
    rag_1.ragService.clearContext();
    return { success: true };
});
electron_1.ipcMain.handle("rag:get-context", async (_, input) => {
    return await rag_1.ragService.getRelevantContext(input);
});
electron_1.ipcMain.handle("tts:generate", async (_, { text, voiceStyle }) => {
    return await (0, tts_1.speak)(text, voiceStyle);
});
electron_1.ipcMain.handle("stt:transcribe", async (_, buffer) => {
    return await (0, stt_1.transcribe)(buffer);
});
// Tool Proxy Handlers
electron_1.ipcMain.handle("tool:news", async (_, url) => {
    try {
        console.log(`📰 [Electron] Proxying News Request: ${url}`);
        // Check if URL is valid newsapi.org URL to allow-list (security)
        if (!url.startsWith("https://newsapi.org/")) {
            throw new Error("Unauthorized URL");
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`News API Error: ${response.statusText}`);
        }
        return await response.json();
    }
    catch (error) {
        console.error("❌ [Electron] News request failed:", error);
        return { error: error.message };
    }
});
// Chat History Persistence
const CHAT_FILE = path_1.default.join(electron_1.app.getPath("userData"), "chat-history.json");
console.log("Chat History Path:", CHAT_FILE);
electron_1.ipcMain.handle("chat:save-history", async (_, history) => {
    try {
        fs_1.default.writeFileSync(CHAT_FILE, JSON.stringify(history, null, 2));
        return true;
    }
    catch (error) {
        console.error("Failed to save chat history:", error);
        return false;
    }
});
electron_1.ipcMain.handle("chat:load-history", async () => {
    try {
        if (fs_1.default.existsSync(CHAT_FILE)) {
            const data = fs_1.default.readFileSync(CHAT_FILE, "utf-8");
            return JSON.parse(data);
        }
        return null;
    }
    catch (error) {
        console.error("Failed to load chat history:", error);
        return null;
    }
});
// Bypass microphone permission prompts and enable speech API
electron_1.app.commandLine.appendSwitch("use-fake-ui-for-media-stream");
electron_1.app.commandLine.appendSwitch("enable-speech-dispatcher");
electron_1.app.whenReady().then(() => {
    startPythonServer();
    startTTSServer();
    createWindow();
    // Global Shortcut for Wake / PTT
    electron_1.globalShortcut.register('Alt+Space', () => {
        console.log("⚡ [Electron] Alt+Space pressed");
        // Broadcast to all windows
        if (mainWindow && !mainWindow.isDestroyed())
            mainWindow.webContents.send('shortcut:pressed');
        if (widgetWindow && !widgetWindow.isDestroyed())
            widgetWindow.webContents.send('shortcut:pressed');
        // If widget is active, we might want to ensure it has focus to capture 'keyup'?
        // But forcing focus might be annoying if user is typing elsewhere. 
        // For now, let's just send the event.
    });
});
electron_1.app.on('will-quit', () => {
    electron_1.globalShortcut.unregisterAll();
});
electron_1.app.on("before-quit", () => {
    if (pythonServerProcess) {
        console.log("Killing Python server...");
        pythonServerProcess.kill();
    }
    if (ttsServerProcess) {
        console.log("Killing TTS server...");
        ttsServerProcess.kill();
    }
});
