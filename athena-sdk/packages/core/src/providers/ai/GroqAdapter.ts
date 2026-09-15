import { AIProviderAdapter, ChatMessage } from '../../types/index.js';

export interface GroqAdapterOptions {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
}

export class GroqAdapter implements AIProviderAdapter {
  id = 'groq';
  name = 'Groq Ultra-Fast AI (Llama 3.3)';

  private apiKey: string;
  private model: string;
  private systemInstruction: string;

  constructor(options: GroqAdapterOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model || 'llama-3.3-70b-versatile';
    this.systemInstruction =
      options.systemInstruction ||
      'You are Athena, an ultra-fast 3D AI assistant. Keep responses natural, engaging, concise, and direct.';
  }

  async *generateStream(prompt: string, history: ChatMessage[]): AsyncIterable<string> {
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const messages = [
      { role: 'system', content: this.systemInstruction },
      ...history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: prompt },
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Groq API Error [${response.status}]: ${await response.text()}`);
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
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const json = JSON.parse(data);
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
    let fullText = '';
    for await (const chunk of this.generateStream(prompt, history)) {
      fullText += chunk;
    }
    return fullText;
  }
}
