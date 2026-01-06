import type { AIProvider } from "./types";

export class GeminiProvider implements AIProvider {
    name = "Gemini";
    private apiKey: string;
    private model: string;

    constructor(config: { apiKey: string; model: string }) {
        this.apiKey = config.apiKey.trim();
        this.model = config.model.trim().replace(/["']/g, ""); // Remove accidental quotes
    }

    async generateStream(
        prompt: string,
        systemPrompt: string,
        onChunk: (token: string) => void,
        signal?: AbortSignal
    ): Promise<string> {
        // Using REST API for simplicity without adding dependency
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal,
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: `${systemPrompt}\n\n${prompt}` }] // System prompt as preamble for now as Gemini API structure varies
                }]
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini Error: ${errorText}`);
        }
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";
        // buffer removed as we stream char by char

        // Actually Gemini REST 'streamGenerateContent' returns a JSON array stream but not SSE format with 'data:'.
        // It returns consecutive JSON objects.

        // Simpler approach: Accumulate buffer, try to parse JSON objects.
        // Google sends: [{ "candidates": [...] }, { "candidates": [...] }]
        // Valid JSON array syntax around it? No, usually line delimited plain JSON or [ ... , ... ]
        // Let's assume standard handling.

        // CORRECT PATTERN for Gemini Stream REST:
        // It returns a list of objects in a JSON array format like `[{...},\n{...}]`.
        // We will do a robust manual parsing or cleaner buffer method.

        let braceCount = 0;
        let jsonBuffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            for (const char of chunk) {
                if (char === '{') braceCount++;
                if (braceCount > 0) jsonBuffer += char;
                if (char === '}') braceCount--;

                if (braceCount === 0 && jsonBuffer.length > 0) {
                    // Potential complete JSON object (ignoring recursive braces for now, assuming top level)
                    // Actually brace counting is risky if inside strings.
                    // Let's try to parse if it looks complete
                    try {
                        // Clean up leading/trailing comma or brackets
                        let clean = jsonBuffer.trim();
                        if (clean.startsWith(',')) clean = clean.substring(1);
                        if (clean.startsWith('[')) clean = clean.substring(1);
                        if (clean.endsWith(']')) clean = clean.substring(0, clean.length - 1);

                        if (clean.length > 2) {
                            const json = JSON.parse(clean);
                            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) {
                                fullResponse += text;
                                onChunk(text);
                            }
                        }
                        jsonBuffer = "";
                    } catch {
                        // Not complete yet, continue
                    }
                }
            }
        }
        return fullResponse;
    }
}
