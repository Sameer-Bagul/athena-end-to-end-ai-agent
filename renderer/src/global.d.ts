
interface Window {
    athena: {
        chat: (messages: any[]) => Promise<string>;
        tts: (text: string, voiceStyle?: string) => Promise<string>;
        transcribe: (buffer: ArrayBuffer) => Promise<string>;
        saveChatHistory: (history: any[]) => Promise<boolean>;
        loadChatHistory: () => Promise<any[]>;
        openWidget: () => Promise<void>;
        closeWidget: () => Promise<void>;
        minimizeWindow: () => Promise<void>;
        maximizeWindow: () => Promise<void>;
        closeWindow: () => Promise<void>;
    }
}
