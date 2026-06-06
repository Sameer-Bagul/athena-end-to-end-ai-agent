import type { AIProvider } from "./types";

export class OpenAICompatibleProvider implements AIProvider {
    name: string;
    private baseUrl: string;
    private apiKey: string;
    private model: string;

    constructor(name: string, baseUrl: string, apiKey: string, model: string) {
        this.name = name;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.model = model;
    }

    getModelName(): string {
        return this.model;
    }

    async getChatModel() {
        const { ChatOpenAI } = await import("@langchain/openai");
        return new ChatOpenAI({
            openAIApiKey: this.apiKey,
            modelName: this.model,
            configuration: {
                baseURL: this.baseUrl,
            },
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
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: prompt }
                    ],
                    stream: true,
                    temperature: 0.7
                }),
                signal
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.statusText}`);
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
                            const data = line.substring(6);
                            if (data === "[DONE]") break;
                            try {
                                const json = JSON.parse(data);
                                const text = json.choices?.[0]?.delta?.content;
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
            console.error("OpenAI session error:", error);
            throw error;
        }
    }
}
