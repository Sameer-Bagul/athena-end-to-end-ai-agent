import * as React from "react";
import { AVAILABLE_MODELS } from "../lib/models";
import type { CharacterProfile } from "../lib/models";
import type { ChatMessage } from "../components/ChatPanel";
import type { WidgetSettings } from "../components/SettingsDialog";
import { aiModuleManager } from "../services/ai/aiModuleManager";

// --- Types ---
export interface UserProfile {
    name: string;
    bio: string;
}

export interface PluginConfig {
    newsApiKey: string;
    weatherApiKey: string;
}

export type AiProviderType = 'ollama' | 'lmstudio' | 'grok' | 'gemini';

export interface AiConfig {
    priority: AiProviderType[];
    ollama: { baseUrl: string; model: string; numCtx?: number; numThread?: number; numGpu?: number }[];
    lmstudio: { baseUrl: string; model: string; numCtx?: number; numThread?: number }[];
    grok: { apiKey: string; model: string }[];
    gemini: { apiKey: string; model: string }[];
}

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
    userProfile: UserProfile;
    pluginConfig: PluginConfig;
    aiConfig: AiConfig;

    // UI state for collapsed panels
    isLeftCollapsed: boolean;
    isRightCollapsed: boolean;

    // RAG Status
    ragStatus: { isReady: boolean, indexedFiles: string[] };

    // Camera
    cameraDeviceId: string;

    // Animation Status
    currentAnimation: string;

    // Model Downloads
    downloadingModels: Record<string, { progress: number, status: string }>; // modelName -> { percentage, status }
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
    setUserProfile: (profile: UserProfile) => void;
    setPluginConfig: (config: PluginConfig) => void;
    setAiConfig: (config: AiConfig) => void;

    // UI
    toggleLeftCollapse: () => void;
    toggleRightCollapse: () => void;
    updateLastMessage: (content: string) => void;
    refreshRagStatus: () => Promise<void>;
    setCameraDeviceId: (id: string) => void;
    setCurrentAnimation: (anim: string) => void;
    setDownloadingModels: (models: Record<string, { progress: number, status: string }>) => void;
    startModelPull: (model: any) => void;
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
        { role: 'assistant', content: "Hi Sameer! I'm here and ready to help. How are you doing today?" }
    ]);
    const [isChatProcessing, setIsChatProcessing] = React.useState(false);

    // Settings
    const [showSettings, setShowSettings] = React.useState(false);
    const [widgetSettings, setWidgetSettings] = React.useState<WidgetSettings>(() => {
        try {
            const saved = localStorage.getItem("athena-widget-settings");
            return saved ? JSON.parse(saved) : { zoom: 0.5, opacity: 0, blur: 0, borderRadius: 50, size: 300, borderWidth: 0 };
        } catch {
            return { zoom: 0.5, opacity: 0, blur: 0, borderRadius: 50, size: 300, borderWidth: 0 };
        }
    });

    const [userProfile, setUserProfile] = React.useState<UserProfile>(() => {
        try {
            const saved = localStorage.getItem("athena-user-profile");
            return saved ? JSON.parse(saved) : { name: "", bio: "" };
        } catch { return { name: "", bio: "" }; }
    });

    const [pluginConfig, setPluginConfig] = React.useState<PluginConfig>(() => {
        try {
            const saved = localStorage.getItem("athena-plugin-config");
            return saved ? JSON.parse(saved) : { newsApiKey: "", weatherApiKey: "" };
        } catch { return { newsApiKey: "", weatherApiKey: "" }; }
    });

    const [aiConfig, setAiConfig] = React.useState<AiConfig>(() => {
        try {
            const saved = localStorage.getItem("athena-ai-config");
            // Defaults (Now arrays)
            const defaults: AiConfig = {
                priority: ['ollama', 'gemini', 'grok', 'lmstudio'],
                ollama: [{ baseUrl: "http://localhost:11434", model: "dolphin-mistral:latest", numCtx: 2048, numThread: 0, numGpu: -1 }],
                lmstudio: [{ baseUrl: "http://localhost:1234/v1", model: "local-model", numCtx: 2048, numThread: 0 }],
                grok: [{ apiKey: "", model: "grok-beta" }],
                gemini: [{ apiKey: "", model: "gemini-pro" }]
            };

            if (saved) {
                const parsed = JSON.parse(saved);

                // Migration Logic:
                // 1. Convert legacy single-objects to arrays
                if (parsed.ollama && !Array.isArray(parsed.ollama)) parsed.ollama = [parsed.ollama];
                if (parsed.lmstudio && !Array.isArray(parsed.lmstudio)) parsed.lmstudio = [parsed.lmstudio];
                if (parsed.grok && !Array.isArray(parsed.grok)) parsed.grok = [parsed.grok];
                if (parsed.gemini && !Array.isArray(parsed.gemini)) parsed.gemini = [parsed.gemini];

                // 2. Ensure priority list exists
                if (!parsed.priority) {
                    const oldProvider = parsed.provider || 'ollama'; // fallback
                    const others = ['ollama', 'gemini', 'grok', 'lmstudio'].filter(p => p !== oldProvider);
                    parsed.priority = [oldProvider, ...others];
                    delete parsed.provider;
                }

                return { ...defaults, ...parsed };
            }
            return defaults;
        } catch {
            return {
                priority: ['ollama', 'gemini', 'grok', 'lmstudio'],
                ollama: [{ baseUrl: "http://localhost:11434", model: "dolphin-mistral:latest", numCtx: 2048, numThread: 0, numGpu: -1 }],
                lmstudio: [{ baseUrl: "http://localhost:1234/v1", model: "local-model", numCtx: 2048, numThread: 0 }],
                grok: [{ apiKey: "", model: "grok-beta" }],
                gemini: [{ apiKey: "", model: "gemini-pro" }]
            };
        }
    });

    // UI
    const [isLeftCollapsed, setIsLeftCollapsed] = React.useState(true);
    const [isRightCollapsed, setIsRightCollapsed] = React.useState(true);

    const [ragStatus, setRagStatus] = React.useState<{ isReady: boolean, indexedFiles: string[] }>({
        isReady: false,
        indexedFiles: []
    });

    // Camera
    const [cameraDeviceId, setCameraDeviceId] = React.useState<string>(() => {
        return localStorage.getItem("athena-camera-id") || "";
    });

    const [currentAnimation, setCurrentAnimation] = React.useState<string>("Idle");
    const [downloadingModels, setDownloadingModelsState] = React.useState<Record<string, { progress: number, status: string }>>({});

    const refreshRagStatus = React.useCallback(async () => {
        // @ts-ignore
        if (window.athena?.rag?.getStatus) {
            // @ts-ignore
            const status = await window.athena.rag.getStatus();
            setRagStatus(status);
        }
    }, []);

    // Initial load
    React.useEffect(() => {
        refreshRagStatus();
    }, [refreshRagStatus]);


    // --- Side Effects & Logic ---

    // Persist Cache
    React.useEffect(() => {
        localStorage.setItem("athena-thumbnail-cache", JSON.stringify(thumbnailCache));
    }, [thumbnailCache]);

    // Persist Widget Settings
    React.useEffect(() => {
        localStorage.setItem("athena-widget-settings", JSON.stringify(widgetSettings));
    }, [widgetSettings]);

    React.useEffect(() => {
        localStorage.setItem("athena-user-profile", JSON.stringify(userProfile));
    }, [userProfile]);

    React.useEffect(() => {
        localStorage.setItem("athena-plugin-config", JSON.stringify(pluginConfig));
    }, [pluginConfig]);

    React.useEffect(() => {
        localStorage.setItem("athena-ai-config", JSON.stringify(aiConfig));
    }, [aiConfig]);

    React.useEffect(() => {
        localStorage.setItem("athena-camera-id", cameraDeviceId);
    }, [cameraDeviceId]);

    // Load Chat History
    React.useEffect(() => {
        const loadHistory = async () => {
            // @ts-ignore
            if (window.athena?.loadChatHistory) {
                // @ts-ignore
                const history = await window.athena.loadChatHistory();
                if (history?.length) setChatMessages(history);
                else setChatMessages([{ role: 'assistant', content: "Hello! I'm Athena. It's great to see you again. Is there anything I can help you with?" }]);
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

        setWidgetSettings: (s) => {
            setWidgetSettings(s);
            // @ts-ignore
            window.athena?.broadcastState?.({ type: 'settings', payload: s });
        },
        toggleSettings: (open) => setShowSettings(p => open ?? !p),
        setUserProfile,
        setPluginConfig,
        setAiConfig,

        toggleLeftCollapse: () => setIsLeftCollapsed(p => !p),
        toggleRightCollapse: () => setIsRightCollapsed(p => !p),
        updateLastMessage: (content: string) => {
            setChatMessages(prev => {
                const newHistory = [...prev];
                const lastIdx = newHistory.length - 1;
                if (lastIdx >= 0) {
                    newHistory[lastIdx] = { ...newHistory[lastIdx], content };
                }
                return newHistory;
            });
        },
        refreshRagStatus,
        setCameraDeviceId,
        setCurrentAnimation,
        setDownloadingModels: setDownloadingModelsState,
        startModelPull: (model: any) => {
            setDownloadingModelsState(prev => ({ ...prev, [model.name]: { progress: 0, status: 'Initializing...' } }));
            aiModuleManager.pullModel(model, (progress) => {
                if (progress.status === "downloading" && progress.total && progress.completed) {
                    const percent = Math.round((progress.completed / progress.total) * 100);
                    setDownloadingModelsState(prev => ({
                        ...prev,
                        [model.name]: { progress: percent, status: 'Downloading...' }
                    }));
                } else if (progress.status === "success") {
                    setDownloadingModelsState(prev => {
                        const next = { ...prev };
                        delete next[model.name];
                        return next;
                    });
                } else if (progress.status === "error") {
                    setDownloadingModelsState(prev => {
                        const next = { ...prev };
                        delete next[model.name];
                        return next;
                    });
                    alert(`Failed to download ${model.name}: ${progress.error}`);
                } else {
                    // Capture intermediate statuses like "pulling manifest", "verifying", etc.
                    setDownloadingModelsState(prev => ({
                        ...prev,
                        [model.name]: { progress: prev[model.name]?.progress || 0, status: progress.status }
                    }));
                }
            });
        }
    };

    const state: AppState = {
        selectedCharacter, vrmFile, vrmUrl, vrmThumbnail, thumbnailCache,
        animationFile, animationUrl, animationSpeed, isPlaying,
        cameraMode, viewMode,
        isListening, voiceStatus, currentTranscript,
        chatMessages, isChatProcessing,
        widgetSettings, showSettings,
        userProfile, pluginConfig, aiConfig,
        isLeftCollapsed, isRightCollapsed,
        ragStatus,
        cameraDeviceId,
        currentAnimation,
        downloadingModels
    };

    return (
        <StoreContext.Provider value={{ state, actions }}>
            {children}
        </StoreContext.Provider>
    );
};
