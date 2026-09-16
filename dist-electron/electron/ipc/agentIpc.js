import { ipcMain } from "electron";
import { speak } from "../../backend/audio/tts.js";
import { transcribe } from "../../backend/audio/stt.js";
export function registerAgentIpcHandlers() {
    ipcMain.handle("agent:query", async (_, { query, systemPrompt, modelName }) => {
        console.log(`\x1b[33m[IPC]\x1b[0m Agent Request: agent:query`);
        try {
            const { runAgent } = await import("../../backend/agent/nativeAgent.js");
            const response = await runAgent(query, systemPrompt, modelName);
            return { success: true, response };
        }
        catch (error) {
            console.error("\n\x1b[31m[ERROR]\x1b[0m Agent Error:", error);
            return { success: false, error: error.message };
        }
    });
    ipcMain.on("agent:query-stream", async (event, { queryId, query, systemPrompt, modelName, apiKey }) => {
        console.log(`\x1b[33m[IPC]\x1b[0m Agent Request: agent:query-stream (${queryId})`);
        try {
            const { runAgent } = await import("../../backend/agent/nativeAgent.js");
            const response = await runAgent(query, systemPrompt, modelName, apiKey, (msg) => {
                event.sender.send(`agent:progress-${queryId}`, msg);
            }, (token) => {
                event.sender.send(`agent:token-${queryId}`, token);
            });
            event.sender.send(`agent:complete-${queryId}`, { success: true, response });
        }
        catch (error) {
            console.error("\n\x1b[31m[ERROR]\x1b[0m Agent Error:", error);
            event.sender.send(`agent:complete-${queryId}`, { success: false, error: error.message });
        }
    });
    ipcMain.on("agent:browser-query-stream", async (event, { queryId, query, modelName, apiKey }) => {
        console.log(`\x1b[33m[IPC]\x1b[0m Agent Request: agent:browser-query-stream (${queryId})`);
        try {
            const { runBrowserAgent } = await import("../../backend/agent/nativeBrowserAgent.js");
            const response = await runBrowserAgent(query, modelName, apiKey, (msg) => {
                event.sender.send(`agent:progress-${queryId}`, msg);
            }, (token) => {
                event.sender.send(`agent:token-${queryId}`, token);
            });
            event.sender.send(`agent:complete-${queryId}`, { success: true, response });
        }
        catch (error) {
            console.error("\n\x1b[31m[ERROR]\x1b[0m Browser Agent Error:", error);
            event.sender.send(`agent:complete-${queryId}`, { success: false, error: error.message });
        }
    });
    ipcMain.handle("tts:generate", async (_, { text, voiceStyle }) => {
        console.log(`\x1b[33m[IPC]\x1b[0m Speech Request: tts:generate (${text.substring(0, 30)}...)`);
        return await speak(text, voiceStyle);
    });
    ipcMain.handle("stt:transcribe", async (_, buffer) => {
        console.log(`\x1b[33m[IPC]\x1b[0m Transcription Request: stt:transcribe (${buffer.byteLength} bytes)`);
        return await transcribe(buffer);
    });
    ipcMain.handle("tool:news", async (_, url) => {
        try {
            console.log(`\n\x1b[36m[Main]\x1b[0m Proxying News Request: ${url}`);
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
            console.error("\n\x1b[31m[ERROR]\x1b[0m News request failed:", error);
            return { error: error.message };
        }
    });
}
