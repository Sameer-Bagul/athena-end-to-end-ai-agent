"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.speak = speak;
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
class TTSFileManager {
    constructor() {
        this.tempFiles = new Set();
        this.MAX_FILES = 50;
    }
    async saveTTS(wavBuffer) {
        const filePath = path_1.default.join(electron_1.app.getPath("userData"), `tts-${Date.now()}.wav`);
        await fs_1.default.promises.writeFile(filePath, wavBuffer);
        this.tempFiles.add(filePath);
        // Cleanup old files when limit reached
        if (this.tempFiles.size > this.MAX_FILES) {
            const oldest = Array.from(this.tempFiles)[0];
            try {
                await fs_1.default.promises.unlink(oldest);
                console.log(`[TTS] Cleaned up old file: ${oldest}`);
            }
            catch (e) {
                console.warn(`[TTS] Failed to delete ${oldest}:`, e);
            }
            this.tempFiles.delete(oldest);
        }
        return filePath;
    }
    async cleanup() {
        console.log(`[TTS] Cleaning up ${this.tempFiles.size} temp files...`);
        const promises = Array.from(this.tempFiles).map(file => fs_1.default.promises.unlink(file).catch(() => { }));
        await Promise.all(promises);
        this.tempFiles.clear();
    }
}
const ttsFileManager = new TTSFileManager();
// Cleanup on app quit
electron_1.app.on('before-quit', async () => {
    await ttsFileManager.cleanup();
});
async function speak(text, voiceStyle = "M1") {
    console.log(`[BACKEND TTS] Request received. Text: "${text.substring(0, 20)}...", Voice: ${voiceStyle}`);
    try {
        const res = await (0, node_fetch_1.default)("http://localhost:3000/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, voiceStyle }),
        });
        if (!res.ok) {
            console.error(`[BACKEND TTS] Server error: ${res.status}`);
            throw new Error(`TTS Server errored: ${res.status}`);
        }
        const arrayBuffer = await res.arrayBuffer();
        const wavBuffer = Buffer.from(arrayBuffer);
        const filePath = await ttsFileManager.saveTTS(wavBuffer);
        console.log(`[BACKEND TTS] Success. Saved to: ${filePath} (${wavBuffer.length} bytes)`);
        return filePath;
    }
    catch (err) {
        console.error("[BACKEND TTS] Failed:", err);
        throw err;
    }
}
