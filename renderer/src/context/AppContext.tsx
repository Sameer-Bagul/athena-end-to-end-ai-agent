import * as React from "react";
import type { CharacterProfile } from "../lib/models";
import { AVAILABLE_MODELS } from "../lib/models";
import type { ChatMessage } from "../components/ChatPanel";
import type { WidgetSettings } from "../components/SettingsDialog";
import { aiModuleManager } from "../services/ai/aiModuleManager";

export interface ActiveTimer {
    id: string;
    label: string;
    duration: number; // in seconds
    remainingTime: number; // in seconds
    endTime: number; // timestamp
}

// --- Types ---
export interface UserProfile {
    name: string;
    bio: string;
}

export interface PluginConfig {
    newsApiKey: string;
    weatherApiKey: string;
}

export interface SceneSettings {
    bgColor: string;
    gridColor: string;
    floorOpacity: number;
    ambientIntensity: number;
    keyLightColor: string;
    fillLightColor: string;
    backLightColor: string;
    fogDensity: number;
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
    sceneSettings: SceneSettings;

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

    // Timers
    activeTimers: ActiveTimer[];

    // MCP Sidecars
    activeSidecars: string[];
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
    setSceneSettings: (settings: Partial<SceneSettings>) => void;

    // UI
    toggleLeftCollapse: () => void;
    toggleRightCollapse: () => void;
    updateLastMessage: (msg: Partial<ChatMessage>) => void;
    refreshRagStatus: () => Promise<void>;
    setCameraDeviceId: (id: string) => void;
    setCurrentAnimation: (anim: string) => void;
    setDownloadingModels: (models: Record<string, { progress: number, status: string }>) => void;
    startModelPull: (model: any) => void;

    // Timers
    addTimer: (duration: number, unit: string, label?: string) => void;
    removeTimer: (id: string) => void;
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
    console.log('[AppContext] Initializing AppProvider...');

    // --- State Initialization ---
    // Content
    const [selectedCharacter, setSelectedCharacter] = React.useState(() => {
        try {
            if (!AVAILABLE_MODELS || AVAILABLE_MODELS.length === 0) {
                throw new Error('No models available');
            }
            return AVAILABLE_MODELS[0];
        } catch (err) {
            console.error('[AppContext] Error initializing selectedCharacter:', err);
            return {
                id: 'fallback',
                name: 'Fallback Model',
                file: '',
                gender: 'female' as const,
                voiceStyle: 'F1',
                systemPrompt: 'I am a fallback assistant.',
                description: 'Fallback Assistant',
                thumbnail: ''
            };
        }
    });

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
    const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>(() => {
        const name = (JSON.parse(localStorage.getItem("athena-user-profile") || "{}")).name || "there";
        return [{ role: 'assistant', content: `Hi ${name}! I'm here and ready to help. How are you doing today?` }];
    });
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
            const defaults: AiConfig = {
                priority: ['ollama', 'gemini', 'grok', 'lmstudio'],
                ollama: [{ baseUrl: "http://localhost:11434", model: "dolphin-mistral:latest", numCtx: 2048, numThread: 0, numGpu: -1 }],
                lmstudio: [{ baseUrl: "http://localhost:1234/v1", model: "local-model", numCtx: 2048, numThread: 0 }],
                grok: [{ apiKey: "", model: "grok-beta" }],
                gemini: [{ apiKey: "", model: "gemini-pro" }]
            };

            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.ollama && !Array.isArray(parsed.ollama)) parsed.ollama = [parsed.ollama];
                if (parsed.lmstudio && !Array.isArray(parsed.lmstudio)) parsed.lmstudio = [parsed.lmstudio];
                if (parsed.grok && !Array.isArray(parsed.grok)) parsed.grok = [parsed.grok];
                if (parsed.gemini && !Array.isArray(parsed.gemini)) parsed.gemini = [parsed.gemini];

                if (!parsed.priority) {
                    const oldProvider = parsed.provider || 'ollama';
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

    const [sceneSettings, setSceneSettingsState] = React.useState<SceneSettings>(() => {
        try {
            const saved = localStorage.getItem("athena-scene-settings");
            const defaults: SceneSettings = {
                bgColor: "#0f0f1e",
                gridColor: "#4b0082",
                floorOpacity: 0.5,
                ambientIntensity: 0.6,
                keyLightColor: "#ffffff",
                fillLightColor: "#00ffff",
                backLightColor: "#ff00ff",
                fogDensity: 0.015
            };
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch {
            return {
                bgColor: "#0f0f1e",
                gridColor: "#4b0082",
                floorOpacity: 0.5,
                ambientIntensity: 0.6,
                keyLightColor: "#ffffff",
                fillLightColor: "#00ffff",
                backLightColor: "#ff00ff",
                fogDensity: 0.015
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
    const [activeTimers, setActiveTimers] = React.useState<ActiveTimer[]>([]);
    const [activeSidecars, setActiveSidecars] = React.useState<string[]>([]);

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

    // Persistence effects
    React.useEffect(() => { localStorage.setItem("athena-thumbnail-cache", JSON.stringify(thumbnailCache)); }, [thumbnailCache]);
    React.useEffect(() => { localStorage.setItem("athena-widget-settings", JSON.stringify(widgetSettings)); }, [widgetSettings]);
    React.useEffect(() => { localStorage.setItem("athena-user-profile", JSON.stringify(userProfile)); }, [userProfile]);
    React.useEffect(() => { localStorage.setItem("athena-plugin-config", JSON.stringify(pluginConfig)); }, [pluginConfig]);
    React.useEffect(() => { localStorage.setItem("athena-ai-config", JSON.stringify(aiConfig)); }, [aiConfig]);
    React.useEffect(() => { localStorage.setItem("athena-scene-settings", JSON.stringify(sceneSettings)); }, [sceneSettings]);
    React.useEffect(() => { localStorage.setItem("athena-camera-id", cameraDeviceId); }, [cameraDeviceId]);

    // Load Chat History
    React.useEffect(() => {
        const loadHistory = async () => {
            // @ts-ignore
            if (window.athena?.loadChatHistory) {
                // @ts-ignore
                const history = await window.athena.loadChatHistory();
                if (history?.length) setChatMessages(history);
                else {
                    const name = userProfile.name || "there";
                    setChatMessages([{ role: 'assistant', content: `Hello ${name}! I'm Athena. It's great to see you. Is there anything I can help you with?` }]);
                }
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

    // Timer Interval Management
    React.useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setActiveTimers(prev => {
                let updated = false;
                const next = prev.map(t => {
                    const remaining = Math.max(0, Math.ceil((t.endTime - now) / 1000));
                    if (remaining !== t.remainingTime) {
                        updated = true;
                        return { ...t, remainingTime: remaining };
                    }
                    return t;
                });

                const finished = next.filter(t => t.remainingTime === 0);
                if (finished.length > 0) {
                    finished.forEach(t => {
                        if (Notification.permission === "granted") {
                            new Notification("Athena Timer", { body: t.label || "Timer finished!", icon: "/icon.png" });
                        }
                        const audio = new Audio("/sounds/cameraClick.mp3");
                        audio.play().catch(() => { });
                    });
                    return next.filter(t => t.remainingTime > 0);
                }
                return updated ? next : prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // --- Actions (Memoized) ---
    const addTimerAction = React.useCallback((duration: number, unit: string, label?: string) => {
        console.log('[AppContext] addTimer called:', { duration, unit, label });
        let seconds = duration;
        if (unit === 'minutes') seconds *= 60;
        if (unit === 'hours') seconds *= 3600;

        const newTimer: ActiveTimer = {
            id: Math.random().toString(36).substr(2, 9),
            label: label || "Timer",
            duration: seconds,
            remainingTime: seconds,
            endTime: Date.now() + (seconds * 1000)
        };
        setActiveTimers(prev => [...prev, newTimer]);
    }, []);

    const removeTimerAction = React.useCallback((id: string) => {
        setActiveTimers(prev => prev.filter(t => t.id !== id));
    }, []);

    const actions = React.useMemo<AppActions>(() => ({
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
            setVrmUrl(url);
        },
        setThumbnail: (id, dataUrl) => setThumbnailCache(prev => ({ ...prev, [id]: dataUrl })),
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
        toggleListening: () => setIsListening(p => !p),
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
        setSceneSettings: (s) => setSceneSettingsState(prev => ({ ...prev, ...s })),
        toggleLeftCollapse: () => setIsLeftCollapsed(p => !p),
        toggleRightCollapse: () => setIsRightCollapsed(p => !p),
        updateLastMessage: (msg: Partial<ChatMessage>) => {
            setChatMessages(prev => {
                const newHistory = [...prev];
                const lastIdx = newHistory.length - 1;
                if (lastIdx >= 0) newHistory[lastIdx] = { ...newHistory[lastIdx], ...msg };
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
                const percent = (progress.completed && progress.total) ? Math.round((progress.completed / progress.total) * 100) : 0;
                setDownloadingModelsState(prev => {
                    if (progress.status === "success" || progress.status === "error") {
                        const next = { ...prev };
                        delete next[model.name];
                        return next;
                    }
                    return { ...prev, [model.name]: { progress: percent, status: progress.status } };
                });
            });
        },
        addTimer: addTimerAction,
        removeTimer: removeTimerAction
    }), [addTimerAction, removeTimerAction, refreshRagStatus, animationSpeed, cameraDeviceId]);

    // --- Bridge Listeners ---
    React.useEffect(() => {
        // Local events (from renderer tools)
        const handleAddTimer = (e: any) => {
            console.log('[AppContext] Local athena:add-timer:', e.detail);
            const { duration, unit, label } = e.detail;
            addTimerAction(duration, unit, label);
        };
        window.addEventListener('athena:add-timer' as any, handleAddTimer);

        // IPC events (from backend agent tools)
        // @ts-ignore
        const unAdd = window.athena.agent?.onAddTimer?.((data: any) => {
            console.log('[AppContext] IPC agent:add-timer:', data);
            addTimerAction(data.duration, data.unit, data.label);
        });

        // @ts-ignore
        const unRemove = window.athena.agent?.onRemoveTimer?.((data: any) => {
            console.log('[AppContext] IPC agent:remove-timer:', data);
            removeTimerAction(data.id);
        });

        // MCP Sidecar Status
        // @ts-ignore
        const unMcp = window.athena.agent?.onMcpStatus?.((data: { name: string, status: 'started' | 'stopped' }) => {
            console.log('[AppContext] MCP Status Update:', data);
            setActiveSidecars(prev => {
                if (data.status === 'started') {
                    return [...new Set([...prev, data.name])];
                } else {
                    return prev.filter(n => n !== data.name);
                }
            });
        });

        return () => {
            window.removeEventListener('athena:add-timer' as any, handleAddTimer);
            if (unAdd) unAdd();
            if (unRemove) unRemove();
            if (unMcp) unMcp();
        };
    }, [addTimerAction, removeTimerAction]);

    const state: AppState = {
        selectedCharacter, vrmFile, vrmUrl, vrmThumbnail, thumbnailCache,
        animationFile, animationUrl, animationSpeed, isPlaying,
        cameraMode, viewMode, isListening, voiceStatus, currentTranscript,
        chatMessages, isChatProcessing, widgetSettings, showSettings,
        userProfile, pluginConfig, aiConfig, sceneSettings,
        isLeftCollapsed, isRightCollapsed, ragStatus, cameraDeviceId,
        currentAnimation, downloadingModels, activeTimers, activeSidecars
    };

    return (
        <StoreContext.Provider value={{ state, actions }}>
            {children}
        </StoreContext.Provider>
    );
};
