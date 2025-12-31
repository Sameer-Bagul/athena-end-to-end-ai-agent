export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const TTS_API_URL = 'http://localhost:3000/tts';
const SYSTEM_PROMPT = "You are Athena, a futuristic AI assistant utilizing a VRM avatar interface. Keep your responses concise, helpful, and immersive. Act like a high-tech system.";

export async function sendMessageToOllama(prompt: string): Promise<string> {
    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "dolphin-mistral:latest",
                prompt: `${SYSTEM_PROMPT}\n\nUser: ${prompt}\nAthena:`,
                stream: false,
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

export async function generateSpeech(text: string): Promise<Blob> {
    try {
        const response = await fetch(TTS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                voiceStyle: 'M1', // Default style
                speed: 1.05
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
