import type { AIProvider } from "./types";

export class OllamaProvider implements AIProvider {
    name = "Ollama";
    private config: { baseUrl: string; model: string; numCtx?: number; numThread?: number; numGpu?: number };

    constructor(config: { baseUrl: string; model: string; numCtx?: number; numThread?: number; numGpu?: number }) {
        this.config = config;
    }

    getModelName(): string {
        return this.config.model;
    }

    async getChatModel() {
        const { ChatOllama } = await import("@langchain/ollama");
        return new ChatOllama({
            baseUrl: this.config.baseUrl,
            model: this.config.model,
            temperature: 0.7,
        });
    }

    async generateStream(
        prompt: string,
        systemPrompt: string,
        onChunk: (token: string) => void,
        signal?: AbortSignal
    ): Promise<string> {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.config.model,
                    prompt: prompt,
                    system: systemPrompt,
                    stream: true,
                    options: {
                        temperature: 0.7,
                        num_ctx: this.config.numCtx || 4096,
                        num_thread: this.config.numThread,
                        num_gpu: this.config.numGpu
                    }
                }),
                signal
            });

            if (!response.ok) {
                throw new Error(`Ollama error: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (!line.trim()) continue;
                        try {
                            const json = JSON.parse(line);
                            if (json.response) {
                                fullText += json.response;
                                onChunk(json.response);
                            }
                        } catch (e) {
                            console.warn("Error parsing Ollama stream chunk", e);
                        }
                    }
                }
            }

            return fullText;
        } catch (error: any) {
            console.error("Ollama generateStream error:", error);
            throw error;
        }
    }
}
