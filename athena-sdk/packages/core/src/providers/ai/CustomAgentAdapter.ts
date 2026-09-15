import { AIProviderAdapter, ChatMessage } from '../../types/index.js';

export interface CustomAgentAdapterOptions {
  endpoint: string;
  headers?: Record<string, string>;
  method?: 'POST' | 'GET';
  transformRequestBody?: (prompt: string, history: ChatMessage[]) => any;
  parseStreamChunk?: (chunk: string) => string | null;
}

export class CustomAgentAdapter implements AIProviderAdapter {
  id = 'custom-agent';
  name = 'Custom Agent Gateway';

  private endpoint: string;
  private headers: Record<string, string>;
  private method: string;
  private transformRequestBody: (prompt: string, history: ChatMessage[]) => any;
  private parseStreamChunk: (chunk: string) => string | null;

  constructor(options: CustomAgentAdapterOptions) {
    this.endpoint = options.endpoint;
    this.headers = options.headers || { 'Content-Type': 'application/json' };
    this.method = options.method || 'POST';
    this.transformRequestBody =
      options.transformRequestBody ||
      ((prompt, history) => ({ prompt, history }));
    this.parseStreamChunk =
      options.parseStreamChunk ||
      ((chunk) => {
        try {
          const parsed = JSON.parse(chunk);
          return parsed.text || parsed.delta || parsed.content || chunk;
        } catch (_) {
          return chunk;
        }
      });
  }

  async *generateStream(prompt: string, history: ChatMessage[]): AsyncIterable<string> {
    const response = await fetch(this.endpoint, {
      method: this.method,
      headers: this.headers,
      body: JSON.stringify(this.transformRequestBody(prompt, history)),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Custom Agent API Error [${response.status}]: ${await response.text()}`);
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
        const trimmed = line.trim();
        if (!trimmed) continue;
        const cleanChunk = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed;
        const text = this.parseStreamChunk(cleanChunk);
        if (text) {
          yield text;
        }
      }
    }
  }

  async generateResponse(prompt: string, history: ChatMessage[]): Promise<string> {
    let text = '';
    for await (const chunk of this.generateStream(prompt, history)) {
      text += chunk;
    }
    return text;
  }
}
