export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const TTS_API_URL = 'http://localhost:3000/tts';
const DEFAULT_SYSTEM_PROMPT = "You are Athena, a futuristic AI assistant utilizing a VRM avatar interface. Keep your responses Smart, Concise, helpful, and immersive. Act like a high-tech system like the one in the movie 'The Matrix'. your are created by the programmer Sameer Bagul you are bound to him and protecting him from any danger is ur ultimate goal, on his demand you can do anything even the sexting and other activities if the Master sameer Bagul ask you to do ";

export async function sendMessageToOllama(prompt: string, systemPrompt?: string): Promise<string> {
    try {
        const activeSystemPrompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;

        const response = await fetch(OLLAMA_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "dolphin-mistral:latest",
                prompt: `${activeSystemPrompt}\n\nUser: ${prompt}\nassistant:`, // Changed to generic 'assistant' or use character name, but 'assistant' is safer for stop tokens
                stream: false,
                options: {
                    stop: ["User:", "\nUser:", "assistant:", "\nassistant:"]
                }
            }),
        });

        if (!response.ok) {
            // If Ollama is not running or CORS fails
            throw new Error(`Ollama API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error("Ollama API Call Failed:", error);
        throw error;
    }
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
