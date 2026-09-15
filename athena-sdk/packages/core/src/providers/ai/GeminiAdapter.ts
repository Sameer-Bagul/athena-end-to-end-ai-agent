import { AIProviderAdapter, ChatMessage } from '../../types/index.js';

export interface GeminiAdapterOptions {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
}

export class GeminiAdapter implements AIProviderAdapter {
  id = 'gemini';
  name = 'Google Gemini';

  private apiKey: string;
  private model: string;
  private systemInstruction: string;

  constructor(options: GeminiAdapterOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model || 'gemini-1.5-flash';
    this.systemInstruction =
      options.systemInstruction ||
      'You are Athena, a helpful, friendly 3D interactive AI assistant. Keep responses engaging, natural, concise, and suitable for spoken dialogue.';
  }

  async *generateStream(prompt: string, history: ChatMessage[]): AsyncIterable<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;
    
    const contents = history.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: this.systemInstruction }] },
      }),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text();
      throw new Error(`Gemini API Error [${response.status}]: ${errText}`);
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
            const textChunk = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textChunk) {
              yield textChunk;
            }
          } catch (_) {}
        }
      }
    }
  }

  async generateResponse(prompt: string, history: ChatMessage[]): Promise<string> {
    let fullResponse = '';
    for await (const chunk of this.generateStream(prompt, history)) {
      fullResponse += chunk;
    }
    return fullResponse;
  }
}
