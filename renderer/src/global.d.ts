
interface Window {
    athena: {
        chat: (messages: any[]) => Promise<string>;
        tts: (text: string, voiceStyle?: string) => Promise<string>;
        transcribe: (buffer: ArrayBuffer) => Promise<string>;
        saveHistory: (history: any[]) => Promise<boolean>;
        loadHistory: () => Promise<any[]>;
    }
}
