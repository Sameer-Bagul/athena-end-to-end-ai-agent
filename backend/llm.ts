import fetch from "node-fetch";
import { config } from "./config.js";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function chatWithLLM(messages: any[], retries = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const res = await fetch(`${config.OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: config.DEFAULT_MODEL, messages }),
        signal: controller.signal as any
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json: any = await res.json();
      return json.message?.content ?? "";

    } catch (error: any) {
      console.error(`[LLM] Attempt ${attempt + 1}/${retries} failed:`, error.message);

      if (attempt === retries - 1) {
        throw new Error(`LLM service failed after ${retries} attempts: ${error.message}`);
      }

      // Exponential backoff: 1s, 2s, 4s
      const backoffMs = Math.pow(2, attempt) * 1000;
      console.log(`[LLM] Retrying in ${backoffMs}ms...`);
      await sleep(backoffMs);
    }
  }

  throw new Error('Max retries exceeded');
}
