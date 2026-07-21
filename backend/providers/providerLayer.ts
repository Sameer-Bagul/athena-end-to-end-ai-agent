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
    const targetModel = options?.model || "gemini-2.5-flash";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: options?.systemInstruction ? { parts: [{ text: options.systemInstruction }] } : undefined,
        contents: messages,
        generationConfig: options?.generationConfig
      })
    });

    if (!res.ok) throw new Error(`Gemini Error: ${await res.text()}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
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
