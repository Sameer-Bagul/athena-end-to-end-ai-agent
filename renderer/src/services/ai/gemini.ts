import type { AIProvider } from "./types";

export class GeminiProvider implements AIProvider {
    name = "Gemini";
    private apiKey: string;
    private model: string;

    constructor(config: { apiKey: string; model: string }) {
        this.apiKey = config.apiKey;
        this.model = config.model;
    }

    getModelName(): string {
        return this.model;
    }

    async getChatModel() {
        const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
        return new ChatGoogleGenerativeAI({
            apiKey: this.apiKey,
            model: this.model,
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
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?key=${this.apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [
                            { role: "user", parts: [{ text: systemPrompt + "\n\n" + prompt }] }
                        ],
                        generationConfig: { temperature: 0.7 }
                    }),
                    signal
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || "Gemini API error");
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n");
                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const json = JSON.parse(line.substring(6));
                                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (text) {
                                    fullText += text;
                                    onChunk(text);
                                }
                            } catch (e) { /* partially received json */ }
                        } else if (line.trim().startsWith("{")) {
                            // Sometimes it's direct JSON in the stream if not properly formatted as SSE
                            try {
                                const json = JSON.parse(line);
                                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (text) {
                                    fullText += text;
                                    onChunk(text);
                                }
                            } catch (e) { /* ignore */ }
                        }
                    }
                }
            }
            return fullText;
        } catch (error: any) {
            console.error("Gemini stream error:", error);
            throw error;
        }
    }
}
