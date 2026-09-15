export interface AIProvider {
  generate(messages: any[], options?: any): Promise<string>;
  stream?(messages: any[], options?: any): AsyncGenerator<string, void, unknown>;
  toolCall?(messages: any[], tools: any[], options?: any): Promise<any>;
  embed?(text: string): Promise<number[]>;
}

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(messages: any[], options?: any): Promise<string> {
    const keyToUse = this.apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
    const headers: any = { "Content-Type": "application/json" };
    if (keyToUse) {
      headers["X-goog-api-key"] = keyToUse;
    }

    const requestedModel = options?.model || "gemini-3.6-flash";
    const modelsToTry = Array.from(new Set([
      requestedModel,
      "gemini-3.6-flash",
      "gemini-flash-latest",
      "gemini-2.5-flash",
      "gemini-1.5-flash"
    ]));

    let lastError: Error | null = null;

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({
              systemInstruction: options?.systemInstruction ? { parts: [{ text: options.systemInstruction }] } : undefined,
              contents: messages,
              generationConfig: options?.generationConfig
            })
          });

          if (res.status === 503 || res.status === 429) {
            console.warn(`[GeminiProvider] Model ${model} returned HTTP ${res.status} (attempt ${attempt + 1}/3). Retrying in ${attempt + 1}s...`);
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }

          if (!res.ok) {
            const errText = await res.text();
            console.warn(`[GeminiProvider] Model ${model} returned HTTP ${res.status}: ${errText}`);
            lastError = new Error(`Gemini Error (${res.status}): ${errText}`);
            break; // Try next model candidate
          }

          const data = await res.json();
          const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText !== undefined) {
            return responseText;
          }
        } catch (e: any) {
          console.warn(`[GeminiProvider] Fetch error with model ${model}:`, e.message);
          lastError = e;
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }

    throw lastError || new Error("Gemini Provider failed on all model candidates and retries.");
  }

  // Future implementations for stream(), toolCall(), etc.
}

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  
  constructor(baseUrl: string = "http://localhost:11434") {
    this.baseUrl = baseUrl;
  }

  async generate(messages: any[], options?: any): Promise<string> {
    const targetModel = options?.model || "qwen2.5-coder:7b";
    
    // Convert systemInstruction to system message for Ollama
    const finalMessages = [...messages];
    if (options?.systemInstruction) {
      finalMessages.unshift({ role: "system", content: options.systemInstruction });
    }

    const reqBody: any = {
      model: targetModel,
      messages: finalMessages.map(m => ({
        role: m.role === "model" ? "assistant" : m.role,
        content: m.parts?.[0]?.text || m.content
      })),
      stream: false
    };

    if (options?.generationConfig?.responseMimeType === "application/json") {
      reqBody.format = "json";
    }

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody)
    });

    if (!res.ok) throw new Error(`Ollama Error: ${await res.text()}`);
    const data = await res.json();
    return data.message?.content || "";
  }
}

/**
 * Factory to get the right provider
 */
export function getAIProvider(providerName: string, config?: any): AIProvider {
  switch (providerName.toLowerCase()) {
    case 'gemini':
      return new GeminiProvider(config?.apiKey || process.env.GOOGLE_API_KEY || '');
    case 'ollama':
      return new OllamaProvider(config?.baseUrl);
    // Add ClaudeProvider, OpenAIProvider later
    default:
      throw new Error(`Provider ${providerName} not supported`);
  }
}
