"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithLLM = chatWithLLM;
const node_fetch_1 = __importDefault(require("node-fetch"));
async function chatWithLLM(messages) {
    const res = await (0, node_fetch_1.default)("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "dolphin-mistral", messages }),
    });
    const json = await res.json();
    return json.message?.content ?? "";
}
