import { AIProviderAdapter, ChatMessage } from '../../types/index.js';

export interface OllamaAdapterOptions {
  model?: string;
  baseUrl?: string;
}

export class OllamaAdapter implements AIProviderAdapter {
  id = 'ollama';
  name = 'Ollama (Local LLM)';

  private model: string;
  private baseUrl: string;

  constructor(options?: OllamaAdapterOptions) {
    this.model = options?.model || 'llama3';
    this.baseUrl = options?.baseUrl || 'http://localhost:11434';
  }

  async *generateStream(prompt: string, history: ChatMessage[]): AsyncIterable<string> {
    const messages = [
      ...history.map((msg) => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: prompt },
    ];

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text();
      throw new Error(`Ollama API Error [${response.status}]: ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const json = JSON.parse(line);
            const content = json.message?.content;
            if (content) {
              yield content;
            }
          } catch (_) {}
        }
      }
    }
  }

  async generateResponse(prompt: string, history: ChatMessage[]): Promise<string> {
    let full = '';
    for await (const chunk of this.generateStream(prompt, history)) {
      full += chunk;
    }
    return full;
  }
}
