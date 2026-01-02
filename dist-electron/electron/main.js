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
// Disable sandbox on Linux
if (process.platform === "linux") {
    electron_1.app.commandLine.appendSwitch("no-sandbox");
}
function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 1000,
        height: 900,
        backgroundColor: "#0b0b0b",
        icon: path_1.default.join(__dirname, isDev ? "../renderer/public/icon.png" : "../renderer/dist/icon.png"),
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
        win.loadFile(path_1.default.join(__dirname, "../renderer/dist/index.html"));
    }
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
try {
    fs_1.default.writeFileSync(path_1.default.join(__dirname, "../../debug-path.txt"), CHAT_FILE);
}
catch (e) {
    console.error("Failed to write debug path:", e);
}
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
electron_1.app.whenReady().then(createWindow);
