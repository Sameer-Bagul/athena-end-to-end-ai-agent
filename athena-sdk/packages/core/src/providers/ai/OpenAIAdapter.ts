import { AIProviderAdapter, ChatMessage } from '../../types/index.js';

export interface OpenAIAdapterOptions {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  systemInstruction?: string;
}

export class OpenAIAdapter implements AIProviderAdapter {
  id = 'openai';
  name = 'OpenAI / Custom API';

  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private systemInstruction: string;

  constructor(options: OpenAIAdapterOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model || 'gpt-4o-mini';
    this.baseUrl = options.baseUrl || 'https://api.openai.com/v1';
    this.systemInstruction =
      options.systemInstruction ||
      'You are Athena, a helpful, friendly 3D interactive AI assistant. Keep responses engaging, natural, concise, and suitable for spoken dialogue.';
  }

  async *generateStream(prompt: string, history: ChatMessage[]): AsyncIterable<string> {
    const messages = [
      { role: 'system', content: this.systemInstruction },
      ...history.map((msg) => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: prompt },
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text();
      throw new Error(`OpenAI API Error [${response.status}]: ${errText}`);
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
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const content = json.choices?.[0]?.delta?.content;
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
