
interface Window {
    athena: {
        chat: (messages: any[]) => Promise<string>;
        tts: (text: string, voiceStyle?: string) => Promise<string>;
        transcribe: (buffer: ArrayBuffer) => Promise<string>;
        getNews: (url: string) => Promise<any>;
        saveChatHistory: (history: any[]) => Promise<boolean>;
        loadChatHistory: () => Promise<any[]>;
        openWidget: () => Promise<void>;
        closeWidget: () => Promise<void>;
        resizeWidget: (width: number, height: number) => Promise<void>;
        minimizeWindow: () => Promise<void>;
        maximizeWindow: () => Promise<void>;
        closeWindow: () => Promise<void>;
        broadcastState: (data: any) => void;
        onSyncReceive: (callback: (data: any) => void) => () => void;
        sendWidgetInput: (text: string) => void;
        onWidgetInput: (callback: (text: string) => void) => () => void;
        onShortcutEvent: (callback: (type: 'pressed' | 'released') => void) => () => void;
    }
}
