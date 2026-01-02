"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
require("dotenv/config");
const llm_1 = require("../backend/llm");
const tts_1 = require("../backend/tts");
const isDev = process.env.NODE_ENV === "development";
// Hack to try and unblock Google Speech API in Electron
process.env.GOOGLE_API_KEY = "ignore";
// Disable sandbox on Linux
if (process.platform === "linux") {
    electron_1.app.commandLine.appendSwitch("no-sandbox");
}
function createWindow() {
    const win = new electron_1.BrowserWindow({
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
        win.loadURL("http://localhost:5173");
        win.webContents.openDevTools();
    }
    else {
        win.loadFile(path_1.default.join(__dirname, "../../renderer/dist/index.html"));
    }
    // Grant microphone permission
    win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'media') {
            callback(true);
        }
        else {
            callback(false);
        }
    });
    // Enable Web Speech API in Electron?
    // Usually works out of the box in newer Electron versions if env is not completely stripped.
}
// IPC handlers for LLM and TTS
electron_1.ipcMain.handle("llm:chat", async (_, messages) => {
    return await (0, llm_1.chatWithLLM)(messages);
});
electron_1.ipcMain.handle("tts:generate", async (_, { text, voiceStyle }) => {
    return await (0, tts_1.speak)(text, voiceStyle);
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
electron_1.app.whenReady().then(createWindow);
