import type { AIProvider } from "./types";
// import type { AiConfig } from "../../context/AppContext"; // Unused now
import { OllamaProvider } from "./ollama";
import { OpenAICompatibleProvider } from "./openai";
import { GeminiProvider } from "./gemini";

// specificConfig is any of the config value types (Ollama config, Gemini config etc)
export function getAIProvider(type: string, specificConfig: any): AIProvider {
    switch (type) {
        case 'ollama':
            return new OllamaProvider(specificConfig);
        case 'lmstudio':
            return new OpenAICompatibleProvider(
                "LM Studio",
                specificConfig.baseUrl,
                "lm-studio", // Key usually ignored
                specificConfig.model
            );
        case 'grok':
            return new OpenAICompatibleProvider(
                "Grok",
                "https://api.x.ai/v1",
                specificConfig.apiKey,
                specificConfig.model
            );
        case 'gemini':
            return new GeminiProvider(specificConfig);
        default:
            return new OllamaProvider(specificConfig);
    }
}
