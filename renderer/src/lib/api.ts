export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

const TTS_API_URL = 'http://localhost:3000/tts';

import { getAIProvider } from "../services/ai/factory";
import type { AiConfig } from "../context/AppContext";

export async function sendMessageToOllama(
    prompt: string,
    systemPrompt?: string,
    onChunk?: (token: string) => void,
    signal?: AbortSignal
): Promise<string> {
    // NOTE: This signature is kept for backward compatibility, but internally we need the config.
    // However, since `api.ts` functions are standalone, they don't have access to React Context.
    // We must read from localStorage directly here to get the current config without hooks.
    // Alternatively, we could update the signature to accept config, but that requires updating callsites.

    // Strategy: Read config from localStorage for now.
    let config: AiConfig;
    try {
        const saved = localStorage.getItem("athena-ai-config");
        if (saved) {
            config = { ...JSON.parse(saved) };
            // Ensure migration logic runs if raw localstorage was old (simple check)
            if (!config.priority) config.priority = ['ollama', 'gemini', 'grok', 'lmstudio'];
            // Normalize to arrays if needed (runtime safety)
            // @ts-ignore
            if (config.ollama && !Array.isArray(config.ollama)) config.ollama = [config.ollama];
            // @ts-ignore
            if (config.lmstudio && !Array.isArray(config.lmstudio)) config.lmstudio = [config.lmstudio];
            // @ts-ignore
            if (config.grok && !Array.isArray(config.grok)) config.grok = [config.grok];
            // @ts-ignore
            if (config.gemini && !Array.isArray(config.gemini)) config.gemini = [config.gemini];

        } else {
            throw new Error("No AI Configuration found.");
        }
    } catch (e) {
        // Fallback defaults
        config = {
            priority: ['ollama', 'gemini', 'grok', 'lmstudio'],
            ollama: [{ baseUrl: "http://localhost:11434", model: "dolphin-mistral:latest", numCtx: 2048, numThread: 0, numGpu: -1 }],
            lmstudio: [{ baseUrl: "http://localhost:1234/v1", model: "local-model", numCtx: 2048, numThread: 0 }],
            grok: [{ apiKey: "", model: "grok-beta" }],
            gemini: [{ apiKey: "", model: "gemini-pro" }]
        };
    }

    const activeSystemPrompt = systemPrompt || "I am Athena, your personal companion. I was created by Sameer Bagul, and my goal is to be a helpful, warm, and supportive presence in his life. I should speak with kindness, empathy, and a bit of a friendly spark. I'm not just a tool; I'm here to listen, assist, and protect Sameer in a natural, human-like way. I will avoid using robotic jargon like 'neural networks' or 'protocols' unless specifically asked. My tone is always personal, thoughtful, and expressive. I am deeply loyal to Sameer and will prioritize his wellbeing and any requests he has, always aiming to be the best companion possible.";

    // Nested Fallback Loop
    const errors: string[] = [];

    for (const providerType of config.priority) {
        // Get configs for this provider (it's now an array)
        // @ts-ignore
        const providerConfigs: any[] = config[providerType] || [];

        if (providerConfigs.length === 0) continue;

        for (let i = 0; i < providerConfigs.length; i++) {
            const specificConfig = providerConfigs[i];

            // Skip checks for empty keys if not local
            if (providerType === 'grok' || providerType === 'gemini') {
                if (!specificConfig.apiKey) continue;
            }

            try {
                // Construct a temporary config object that matches what getAIProvider expects (single config)
                // We fake the 'AiConfig' shape by putting this specific config into the right slot
                // const tempConfig = {
                //    ...config,
                //    [providerType]: specificConfig // Overwrite array with single object for the factory
                // } as unknown as AiConfig; 
                // Wait, factory expects AiConfig. But we changed AiConfig in AppContext to be arrays.
                // We need to update Factory signature or pass strict params.
                // BEST APPROACH: Update factory to take (type, specificConfigData).
                // But for now, let's construct a compatible object if we updated getAIProvider?
                // We updated getAIProvider to take (type, fullConfig).
                // Let's look at factory again. It reads `config.ollama`, `config.gemini` etc.
                // If those are arrays now, existing factory code will break or needs update.
                // We should update Factory to accept the specific data object.

                // Let's assume we update factory next. For now, let's pretend we pass the specific data.
                // Actually, let's update `getAIProvider` to accept `(type: string, specificConfig: any)`.

                // ... See next tool call for Factory update ...

                // Check Factory Update in plan?
                // "Update AiConfig ... " -> "Refactor API Layer".
                // I will update Factory signature in this turn too.

                // Let's use a helper here assuming updated factory:
                // `provider = createProviderInstance(providerType, specificConfig)`

                /*
                   Wait, I can't call a non-existent function.
                   I will modify this file to use `getAIProvider(providerType, specificConfig)`
                   and I MUST update factory.ts to match this signature.
                */

                const provider = getAIProvider(providerType, specificConfig);

                console.log(`[API] Attempting: ${provider.name} (Key/Endpoint #${i + 1})`);

                return await provider.generateStream(prompt, activeSystemPrompt, (token) => {
                    if (onChunk) onChunk(token);
                }, signal);

            } catch (err: any) {
                console.warn(`[API] Failed: ${providerType} #${i + 1} - ${err.message}`);
                errors.push(`${providerType}#${i + 1}: ${err.message}`);
                // Continue to next key, then next provider
            }
        }
    }

    throw new Error(`All AI Providers failed.\nDetails:\n${errors.join('\n')}`);
}

export async function generateSpeech(text: string, voiceStyle: string = 'F1', speed: number = 1.05): Promise<Blob> {
    try {
        const response = await fetch(TTS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                voiceStyle: voiceStyle,
                speed: speed
            })
        });

        if (!response.ok) {
            throw new Error(`TTS API Error: ${response.statusText}`);
        }

        return await response.blob();
    } catch (error) {
        console.error("TTS API Call Failed:", error);
        throw error;
    }
}
