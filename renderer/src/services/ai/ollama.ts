import type { AIProvider } from "./types";
// import type { AiConfig } from "../../context/AppContext"; // Unused

export class OllamaProvider implements AIProvider {
    name = "Ollama";
    private config: { baseUrl: string; model: string; numCtx?: number; numThread?: number; numGpu?: number };

    constructor(config: { baseUrl: string; model: string; numCtx?: number; numThread?: number; numGpu?: number }) {
        // Sanitize: ensure no trailing slash for base, remove accidental quotes
        this.config = {
            baseUrl: config.baseUrl.trim().replace(/\/$/, ""),
            model: config.model.trim().replace(/["']/g, ""),
            numCtx: config.numCtx,
            numThread: config.numThread,
            numGpu: config.numGpu
        };
    }

    async generateStream(
        prompt: string,
        systemPrompt: string,
        onChunk: (token: string) => void,
        signal?: AbortSignal
    ): Promise<string> {
        console.log(`🧠 [Ollama] Sending prompt (Ctx: ${this.config.numCtx || 'def'}): "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`);
        const response = await fetch(`${this.config.baseUrl}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal,
            body: JSON.stringify({
                model: this.config.model,
                prompt: `${systemPrompt}\n\nUser: ${prompt}\nassistant:`,
                stream: true,
                options: {
                    stop: ["User:", "\nUser:", "assistant:", "\nassistant:"],
                    num_ctx: this.config.numCtx || 2048,
                    num_thread: this.config.numThread || 0,
                    num_gpu: this.config.numGpu ?? -1
                }
            }),
        });

        if (!response.ok) throw new Error(`Ollama Error: ${response.statusText}`);
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const json = JSON.parse(line);
                    if (json.response) {
                        fullResponse += json.response;
                        onChunk(json.response);
                    }
                } catch (e) {
                    console.warn("Ollama parse error", e);
                }
            }
        }
        console.log(`🧠 [Ollama] Response complete. Length: ${fullResponse.length} chars`);
        return fullResponse;
    }
}
