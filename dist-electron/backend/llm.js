"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithLLM = chatWithLLM;
const node_fetch_1 = __importDefault(require("node-fetch"));
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function chatWithLLM(messages, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
            const res = await (0, node_fetch_1.default)("http://localhost:11434/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: "dolphin-mistral", messages }),
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const json = await res.json();
            return json.message?.content ?? "";
        }
        catch (error) {
            console.error(`[LLM] Attempt ${attempt + 1}/${retries} failed:`, error.message);
            if (attempt === retries - 1) {
                throw new Error(`LLM service failed after ${retries} attempts: ${error.message}`);
            }
            // Exponential backoff: 1s, 2s, 4s
            const backoffMs = Math.pow(2, attempt) * 1000;
            console.log(`[LLM] Retrying in ${backoffMs}ms...`);
            await sleep(backoffMs);
        }
    }
    throw new Error('Max retries exceeded');
}
