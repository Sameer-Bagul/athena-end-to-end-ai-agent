import * as React from "react";
import { AVAILABLE_MODELS } from "../lib/models";
import type { CharacterProfile } from "../lib/models";
import type { ChatMessage } from "../components/ChatPanel";
import type { WidgetSettings } from "../components/SettingsDialog";

// --- Types ---
export interface AppState {
    // Content
    selectedCharacter: CharacterProfile;
    vrmFile: File | null;
    vrmUrl: string;
    vrmThumbnail: string | null;
    thumbnailCache: Record<string, string>;

    // Animation
    animationFile: File | null;
    animationUrl: string;
    animationSpeed: number; // Simplified to number
    isPlaying: boolean;

    // View / Camera
    cameraMode: string;
    viewMode: 'chat' | 'exhibition';

    // Session / Voice
    isListening: boolean;
    voiceStatus: string;
    currentTranscript: string;

    // Chat
    chatMessages: ChatMessage[];
    isChatProcessing: boolean;

    // Settings
    widgetSettings: WidgetSettings;
    showSettings: boolean;

    // UI state for collapsed panels
    isLeftCollapsed: boolean;
    isRightCollapsed: boolean;
}

export interface AppActions {
    // Content
    setModel: (profileId: string) => void;
    setVrmFile: (file: File) => void;
    setThumbnail: (id: string, dataUrl: string) => void;

    // Animation
    setAnimation: (filename: string) => void; // For preset
    setAnimationFile: (file: File) => void; // For custom
    setAnimationSpeed: (speed: number) => void;
    togglePlay: () => void;

    // View
    setCameraMode: (mode: string) => void;
    setViewMode: (mode: 'chat' | 'exhibition') => void;

    // Voice
    toggleListening: () => void;
    setVoiceStatus: (status: string) => void;

    // Chat
    addMessage: (msg: ChatMessage) => void;
    setChatProcessing: (processing: boolean) => void;
    clearChat: () => void;
    setTranscript: (text: string) => void;

    // Settings
    setWidgetSettings: (settings: WidgetSettings) => void;
    toggleSettings: (open?: boolean) => void;

    // UI
    toggleLeftCollapse: () => void;
    toggleRightCollapse: () => void;
}

const StoreContext = React.createContext<{ state: AppState; actions: AppActions } | null>(null);

export const useAppStore = () => {
    const context = React.useContext(StoreContext);
    if (!context) {
        throw new Error("useAppStore must be used within an AppProvider");
    }
    return context;
};

// --- Provider ---
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    // --- State Initialization ---
    // Content
    const [selectedCharacter, setSelectedCharacter] = React.useState(AVAILABLE_MODELS[0]);
    const [vrmFile, _setVrmFileState] = React.useState<File | null>(null);
    const [vrmUrl, setVrmUrl] = React.useState<string>(`models/${AVAILABLE_MODELS[0].file}`);
    const [vrmThumbnail, setVrmThumbnail] = React.useState<string | null>(null);
    const [thumbnailCache, setThumbnailCache] = React.useState<Record<string, string>>(() => {
        try {
            return JSON.parse(localStorage.getItem("athena-thumbnail-cache") || "{}");
        } catch { return {}; }
    });

    // Animation
    const [animationFile, _setAnimationFileState] = React.useState<File | null>(null);
    const [animationUrl, setAnimationUrl] = React.useState<string>("animations/Jump.vrma");
    const [animationSpeed, setAnimationSpeed] = React.useState(0.4);
    const [isPlaying, setIsPlaying] = React.useState(false);

    // View
    const [cameraMode, setCameraMode] = React.useState("full");
    const [viewMode, setViewMode] = React.useState<'chat' | 'exhibition'>('chat');

    // Voice
    const [isListening, setIsListening] = React.useState(false);
    const [voiceStatus, setVoiceStatus] = React.useState("idle");
    const [currentTranscript, setCurrentTranscript] = React.useState("");

    // Chat
    const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([
        { role: 'assistant', content: 'Initializing...' }
    ]);
    const [isChatProcessing, setIsChatProcessing] = React.useState(false);

    // Settings
    const [showSettings, setShowSettings] = React.useState(false);
    const [widgetSettings, setWidgetSettings] = React.useState<WidgetSettings>({
        zoom: 0.5, opacity: 0, blur: 0, borderRadius: 50, size: 300
    });

    // UI
    const [isLeftCollapsed, setIsLeftCollapsed] = React.useState(false);
    const [isRightCollapsed, setIsRightCollapsed] = React.useState(false);


    // --- Side Effects & Logic ---

    // Persist Cache
    React.useEffect(() => {
        localStorage.setItem("athena-thumbnail-cache", JSON.stringify(thumbnailCache));
    }, [thumbnailCache]);

    // Load Chat History
    React.useEffect(() => {
        const loadHistory = async () => {
            // @ts-ignore
            if (window.athena?.loadChatHistory) {
                // @ts-ignore
                const history = await window.athena.loadChatHistory();
                if (history?.length) setChatMessages(history);
                else setChatMessages([{ role: 'assistant', content: 'Greetings. I am Athena.' }]);
            }
        };
        loadHistory();
    }, []);

    // Save Chat History
    React.useEffect(() => {
        if (chatMessages.length > 0) {
            // @ts-ignore
            window.athena?.saveChatHistory?.(chatMessages);
        }
    }, [chatMessages]);


    // --- Actions ---

    const actions: AppActions = {
        setModel: (id: string) => {
            const profile = AVAILABLE_MODELS.find(p => p.id === id);
            if (profile) {
                setSelectedCharacter(profile);
                _setVrmFileState(null);
                setVrmThumbnail(null);
                setVrmUrl(`models/${profile.file}`);
                // @ts-ignore
                window.athena?.broadcastState?.({ type: 'model', payload: { id } });
            }
        },
        setVrmFile: (file: File) => {
            const url = URL.createObjectURL(file);
            _setVrmFileState(file);
            setVrmUrl(url); // Note: cleanup previous URL if needed
            // For custom models, we create a dummy profile or override selectedCharacter
            // We'll keep selectedCharacter as is but vrmUrl overrides it in the viewer
        },
        setThumbnail: (id, dataUrl) => {
            setThumbnailCache(prev => ({ ...prev, [id]: dataUrl }));
        },
        setAnimation: (filename) => {
            setAnimationUrl(`animations/${filename}`);
            _setAnimationFileState(null);
            setIsPlaying(true);
        },
        setAnimationFile: (file) => {
            _setAnimationFileState(file);
            setAnimationUrl(URL.createObjectURL(file));
            setIsPlaying(true);
        },
        setAnimationSpeed,
        togglePlay: () => setIsPlaying(p => !p),
        setCameraMode,
        setViewMode,

        toggleListening: () => {
            // Logic needs access to Speech Manager? 
            // Ideally Speech Manager is internal to context or a hook.
            // We'll expose the state, but actual toggling logic might need to live in the Component 
            // OR we instantiate SpeechManager here.
            setIsListening(p => !p);
        },
        setVoiceStatus,

        addMessage: (msg) => setChatMessages(prev => [...prev, msg]),
        setChatProcessing: setIsChatProcessing,
        clearChat: () => setChatMessages([{ role: 'assistant', content: 'History cleared.' }]),
        setTranscript: setCurrentTranscript,

        setWidgetSettings,
        toggleSettings: (open) => setShowSettings(p => open ?? !p),

        toggleLeftCollapse: () => setIsLeftCollapsed(p => !p),
        toggleRightCollapse: () => setIsRightCollapsed(p => !p)
    };

    const state: AppState = {
        selectedCharacter, vrmFile, vrmUrl, vrmThumbnail, thumbnailCache,
        animationFile, animationUrl, animationSpeed, isPlaying,
        cameraMode, viewMode,
        isListening, voiceStatus, currentTranscript,
        chatMessages, isChatProcessing,
        widgetSettings, showSettings,
        isLeftCollapsed, isRightCollapsed
    };

    return (
        <StoreContext.Provider value={{ state, actions }}>
            {children}
        </StoreContext.Provider>
    );
};
