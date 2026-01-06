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

    async generateStream(
        prompt: string,
        systemPrompt: string,
        onChunk: (token: string) => void,
        signal?: AbortSignal
    ): Promise<string> {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            signal,
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ],
                stream: true
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`${this.name} Error (${response.status}): ${errorText}`);
        }
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
                const trimmed = line.trim();
                if (!trimmed || trimmed === "data: [DONE]") continue;
                if (!trimmed.startsWith("data: ")) continue;

                try {
                    const json = JSON.parse(trimmed.substring(6));
                    const content = json.choices?.[0]?.delta?.content || "";
                    if (content) {
                        fullResponse += content;
                        onChunk(content);
                    }
                } catch (e) {
                    console.warn(`${this.name} parse error`, e);
                }
            }
        }
        return fullResponse;
    }
}
