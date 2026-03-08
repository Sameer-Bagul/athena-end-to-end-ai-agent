import { logger } from "../../lib/logger";

export interface AIModelInfo {
    id: string;
    name: string;
    label: string;
    description: string;
    size: string;
    params: string;
    category: 'brain' | 'intelligence' | 'presence'; // LLM | STT | TTS
}

export const RECOMMENDED_MODELS: AIModelInfo[] = [
    // --- Conceptual Brain (Ollama) ---
    {
        id: "ollama-dolphin",
        name: "dolphin-mistral:latest",
        label: "Athena Brain (Uncensored)",
        description: "Powered by Dolphin-Mistral. Fast, uncensored, and highly capable for complex reasoning.",
        size: "4.1 GB",
        params: "7B",
        category: 'brain'
    },
    {
        id: "ollama-llama3",
        name: "llama3:latest",
        label: "Llama 3",
        description: "Meta's powerful general-purpose model.",
        size: "4.7 GB",
        params: "8B",
        category: 'brain'
    },
    {
        id: "ollama-phi3",
        name: "phi3:mini",
        label: "Phi-3 Mini",
        description: "Ultra-fast model from Microsoft, great for machines with less RAM.",
        size: "2.3 GB",
        params: "3.8B",
        category: 'brain'
    },
    {
        id: "ollama-qwen1.5b",
        name: "qwen2.5:1.5b",
        label: "Qwen 2.5 1.5B (Turbo)",
        description: "Exceptionally fast and intelligent for its size. Ideal for low-end CPUs.",
        size: "986 MB",
        params: "1.5B",
        category: 'brain'
    },
    {
        id: "ollama-llama1b",
        name: "llama3.2:1b",
        label: "Llama 3.2 1B (Light)",
        description: "Meta's smallest model. Minimal latency, perfect for simple chat.",
        size: "1.3 GB",
        params: "1B",
        category: 'brain'
    },
    // --- Intelligence / STT (Whisper) ---
    {
        id: "stt-tiny",
        name: "tiny.en",
        label: "Whisper Tiny (Fastest)",
        description: "Low power usage, very fast transcription. Recommended for most users.",
        size: "75 MB",
        params: "39M",
        category: 'intelligence'
    },
    {
        id: "stt-base",
        name: "base.en",
        label: "Whisper Base (Balanced)",
        description: "Better accuracy while remaining fast on most modern CPUs.",
        size: "145 MB",
        params: "74M",
        category: 'intelligence'
    },
    // --- Presence / TTS (Supertonic) ---
    {
        id: "tts-standard",
        name: "standard-v1",
        label: "Natural Voice v1",
        description: "High-quality neural text-to-speech baseline.",
        size: "250 MB",
        params: "ONNX",
        category: 'presence'
    }
];

export interface PullProgress {
    model: string;
    status: string;
    digest?: string;
    total?: number;
    completed?: number;
    error?: string;
}

class AIModuleManager {
    /**
     * Check if Ollama is running
     */
    async checkOllamaStatus(): Promise<boolean> {
        try {
            // @ts-ignore
            const res = await window.athena.ollama.checkStatus();
            return res.ok;
        } catch (e) {
            return false;
        }
    }

    /**
     * List Ollama models
     */
    async listOllamaModels(): Promise<any[]> {
        try {
            // @ts-ignore
            return await window.athena.ollama.listModels();
        } catch (e) {
            logger.error("Failed to list local Ollama models:", e);
            return [];
        }
    }

    /**
     * Unified pull model (Ollama or Direct)
     */
    pullModel(model: AIModelInfo, onProgress: (progress: PullProgress) => void) {
        console.log(`📥 [AIModuleManager] Initiating pull for: ${model.name} (${model.category})`);
        if (model.category === 'brain') {
            return this.pullOllamaModel(model.name, onProgress);
        } else {
            // @ts-ignore
            const unsubscribe = window.athena.models.onProgress((data: any) => {
                if (data.model === model.name) {
                    onProgress({
                        model: model.name,
                        status: data.status === "success" ? "success" : "downloading",
                        completed: data.completed,
                        total: data.total,
                        error: data.error
                    });
                    if (data.status === "success" || data.status === "error") {
                        unsubscribe();
                    }
                }
            });

            // @ts-ignore
            window.athena.models.pull(model.name);
            return unsubscribe;
        }
    }

    /**
     * Pull Ollama model
     */
    private pullOllamaModel(name: string, onProgress: (progress: PullProgress) => void) {
        // @ts-ignore
        const unsubscribe = window.athena.ollama.onPullProgress((data: PullProgress) => {
            if (data.model === name) {
                onProgress(data);
                if (data.status === "success" || data.status === "error") {
                    unsubscribe();
                }
            }
        });

        // @ts-ignore
        console.log(`🧠 [Ollama] Pulling model: ${name}`);
        (window as any).athena.ollama.pullModel(name);
        return unsubscribe;
    }

    /**
     * Unified helper to get all recommended models with their install status
     */
    async getAllRecommended(): Promise<(AIModelInfo & { isInstalled: boolean })[]> {
        // 1. Get Ollama models
        const localOllama = await this.listOllamaModels();
        // @ts-ignore
        const localOllamaNames = (localOllama || []).map(m => m.name);

        const results = await Promise.all(RECOMMENDED_MODELS.map(async m => {
            let isInstalled = false;
            if (m.category === 'brain') {
                isInstalled = localOllamaNames.some((name: string) => name.startsWith(m.name.split(':')[0]));
            } else {
                // Check Whisper / TTS via Electron
                // @ts-ignore
                const status = await window.athena.models.checkStatus(m.name);
                isInstalled = status.isInstalled;
            }

            return { ...m, isInstalled };
        }));

        return results;
    }

    /**
     * Unified uninstall model (Ollama or Direct)
     */
    async uninstallModel(model: AIModelInfo): Promise<boolean> {
        if (model.category === 'brain') {
            try {
                // @ts-ignore
                const res = await window.athena.ollama.deleteModel(model.name);
                return !!res.ok;
            } catch (e) {
                logger.error("Failed to delete Ollama model:", e);
                return false;
            }
        } else {
            try {
                // @ts-ignore
                const res = await window.athena.models.delete(model.name);
                return !!res.success;
            } catch (e) {
                logger.error("Failed to delete local model:", e);
                return false;
            }
        }
    }
}

export const aiModuleManager = new AIModuleManager();
