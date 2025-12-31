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
async function speak(text, voiceStyle = "M1") {
    const res = await (0, node_fetch_1.default)("http://localhost:3000/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceStyle }),
    });
    const wavBuffer = Buffer.from(await res.arrayBuffer());
    const filePath = path_1.default.join(electron_1.app.getPath("userData"), `tts-${Date.now()}.wav`);
    fs_1.default.writeFileSync(filePath, wavBuffer);
    return filePath;
}
