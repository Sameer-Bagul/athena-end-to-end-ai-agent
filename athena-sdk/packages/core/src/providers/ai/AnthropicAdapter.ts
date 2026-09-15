import { AIProviderAdapter, ChatMessage } from '../../types/index.js';

export interface AnthropicAdapterOptions {
  apiKey: string;
  model?: string;
  systemPrompt?: string;
}

export class AnthropicAdapter implements AIProviderAdapter {
  id = 'anthropic';
  name = 'Anthropic Claude';

  private apiKey: string;
  private model: string;
  private systemPrompt: string;

  constructor(options: AnthropicAdapterOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model || 'claude-3-5-sonnet-20241022';
    this.systemPrompt =
      options.systemPrompt ||
      'You are Athena, a friendly, intelligent 3D AI companion. Keep answers concise, natural, and suitable for spoken dialogue.';
  }

  async *generateStream(prompt: string, history: ChatMessage[]): AsyncIterable<string> {
    const url = 'https://api.anthropic.com/v1/messages';

    const messages = history.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    messages.push({ role: 'user', content: prompt });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        system: this.systemPrompt,
        messages,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Anthropic API Error [${response.status}]: ${await response.text()}`);
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
          try {
            const json = JSON.parse(line.slice(6));
            if (json.type === 'content_block_delta' && json.delta?.text) {
              yield json.delta.text;
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
