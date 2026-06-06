import { create } from 'zustand';
import { AVAILABLE_MODELS } from '../lib/models';
import type { CharacterProfile } from '../lib/models';
import type { ChatMessage } from '../components/ChatPanel';
import type { WidgetSettings } from '../components/SettingsDialog';
import { aiModuleManager } from '../services/ai/aiModuleManager';

export interface ActiveTimer {
    id: string;
    label: string;
    duration: number;
    remainingTime: number;
    endTime: number;
}

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
    selectedCharacter: CharacterProfile;
    vrmFile: File | null;
    vrmUrl: string;
    vrmThumbnail: string | null;
    thumbnailCache: Record<string, string>;
    animationFile: File | null;
    animationUrl: string;
    animationSpeed: number;
    isPlaying: boolean;
    cameraMode: string;
    viewMode: 'chat' | 'exhibition';
    isListening: boolean;
    voiceStatus: string;
    currentTranscript: string;
    chatMessages: ChatMessage[];
    isChatProcessing: boolean;
    widgetSettings: WidgetSettings;
    showSettings: boolean;
    userProfile: UserProfile;
    pluginConfig: PluginConfig;
    aiConfig: AiConfig;
    sceneSettings: SceneSettings;
    isLeftCollapsed: boolean;
    isRightCollapsed: boolean;
    ragStatus: { isReady: boolean, indexedFiles: string[] };
    cameraDeviceId: string;
    currentAnimation: string;
    downloadingModels: Record<string, { progress: number, status: string }>;
    activeTimers: ActiveTimer[];
    activeSidecars: string[];
}

export interface AppActions {
    setModel: (profileId: string) => void;
    setVrmFile: (file: File) => void;
    setThumbnail: (id: string, dataUrl: string) => void;
    setAnimation: (filename: string) => void;
    setAnimationFile: (file: File) => void;
    setAnimationSpeed: (speed: number) => void;
    togglePlay: () => void;
    setCameraMode: (mode: string) => void;
    setViewMode: (mode: 'chat' | 'exhibition') => void;
    toggleListening: () => void;
    setVoiceStatus: (status: string) => void;
    addMessage: (msg: ChatMessage) => void;
    setChatProcessing: (processing: boolean) => void;
    clearChat: () => void;
    setTranscript: (text: string) => void;
    setWidgetSettings: (settings: WidgetSettings) => void;
    toggleSettings: (open?: boolean) => void;
    setUserProfile: (profile: UserProfile) => void;
    setPluginConfig: (config: PluginConfig) => void;
    setAiConfig: (config: AiConfig) => void;
    setSceneSettings: (settings: Partial<SceneSettings>) => void;
    toggleLeftCollapse: () => void;
    toggleRightCollapse: () => void;
    updateLastMessage: (msg: Partial<ChatMessage>) => void;
    refreshRagStatus: () => Promise<void>;
    setCameraDeviceId: (id: string) => void;
    setCurrentAnimation: (anim: string) => void;
    setDownloadingModels: (models: Record<string, { progress: number, status: string }>) => void;
    startModelPull: (model: any) => void;
    addTimer: (duration: number, unit: string, label?: string) => void;
    removeTimer: (id: string) => void;
    setChatMessages: (messages: ChatMessage[]) => void;
    setActiveTimers: (timers: ActiveTimer[] | ((prev: ActiveTimer[]) => ActiveTimer[])) => void;
    setActiveSidecars: (sidecars: string[] | ((prev: string[]) => string[])) => void;
    setRagStatus: (status: { isReady: boolean, indexedFiles: string[] }) => void;
}

interface StoreState {
    state: AppState;
    actions: AppActions;
}

export const useAppStore = create<StoreState>((set) => {
    // Initialization reading from local storage where appropriate
    let initialSelectedCharacter = AVAILABLE_MODELS[0];
    
    let initialThumbnailCache = {};
    try { initialThumbnailCache = JSON.parse(localStorage.getItem("athena-thumbnail-cache") || "{}"); } catch {}

    let initialChatMessages = [{ role: 'assistant' as const, content: 'Hi there! I am here and ready to help. How are you doing today?' }];
    let initialUserProfile = { name: "", bio: "" };
    try {
        const saved = localStorage.getItem("athena-user-profile");
        if (saved) initialUserProfile = JSON.parse(saved);
        if (initialUserProfile.name) {
            initialChatMessages[0].content = `Hi ${initialUserProfile.name}! I'm here and ready to help. How are you doing today?`;
        }
    } catch {}

    let initialWidgetSettings = { zoom: 0.5, opacity: 0, blur: 0, borderRadius: 50, size: 300, borderWidth: 0 };
    try {
        const saved = localStorage.getItem("athena-widget-settings");
        if (saved) initialWidgetSettings = JSON.parse(saved);
    } catch {}

    let initialPluginConfig = { newsApiKey: "", weatherApiKey: "" };
    try {
        const saved = localStorage.getItem("athena-plugin-config");
        if (saved) initialPluginConfig = JSON.parse(saved);
    } catch {}

    let initialAiConfig: AiConfig = {
        priority: ['ollama', 'gemini', 'grok', 'lmstudio'],
        ollama: [{ baseUrl: "http://localhost:11434", model: "dolphin-mistral:latest", numCtx: 2048, numThread: 0, numGpu: -1 }],
        lmstudio: [{ baseUrl: "http://localhost:1234/v1", model: "local-model", numCtx: 2048, numThread: 0 }],
        grok: [{ apiKey: "", model: "grok-beta" }],
        gemini: [{ apiKey: "", model: "gemini-pro" }]
    };
    try {
        const saved = localStorage.getItem("athena-ai-config");
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
            initialAiConfig = { ...initialAiConfig, ...parsed };
        }
    } catch {}

    let initialSceneSettings: SceneSettings = {
        bgColor: "#0f0f1e",
        gridColor: "#4b0082",
        floorOpacity: 0.5,
        ambientIntensity: 0.6,
        keyLightColor: "#ffffff",
        fillLightColor: "#00ffff",
        backLightColor: "#ff00ff",
        fogDensity: 0.015
    };
    try {
        const saved = localStorage.getItem("athena-scene-settings");
        if (saved) initialSceneSettings = { ...initialSceneSettings, ...JSON.parse(saved) };
    } catch {}

    const initialCameraDeviceId = localStorage.getItem("athena-camera-id") || "";

    const addTimerImpl = (duration: number, unit: string, label?: string) => {
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
        set(s => ({ state: { ...s.state, activeTimers: [...s.state.activeTimers, newTimer] } }));
    };

    return {
        state: {
            selectedCharacter: initialSelectedCharacter,
            vrmFile: null,
            vrmUrl: `models/${initialSelectedCharacter.file}`,
            vrmThumbnail: null,
            thumbnailCache: initialThumbnailCache,
            animationFile: null,
            animationUrl: "animations/Jump.vrma",
            animationSpeed: 0.4,
            isPlaying: false,
            cameraMode: "full",
            viewMode: 'chat',
            isListening: false,
            voiceStatus: "idle",
            currentTranscript: "",
            chatMessages: initialChatMessages,
            isChatProcessing: false,
            showSettings: false,
            widgetSettings: initialWidgetSettings,
            userProfile: initialUserProfile,
            pluginConfig: initialPluginConfig,
            aiConfig: initialAiConfig,
            sceneSettings: initialSceneSettings,
            isLeftCollapsed: true,
            isRightCollapsed: true,
            ragStatus: { isReady: false, indexedFiles: [] },
            cameraDeviceId: initialCameraDeviceId,
            currentAnimation: "Idle",
            downloadingModels: {},
            activeTimers: [],
            activeSidecars: []
        },
        actions: {
            setModel: (id) => set(s => {
                const profile = AVAILABLE_MODELS.find(p => p.id === id);
                if (profile) {
                    // @ts-ignore
                    window.athena?.broadcastState?.({ type: 'model', payload: { id } });
                    return { state: { ...s.state, selectedCharacter: profile, vrmFile: null, vrmThumbnail: null, vrmUrl: `models/${profile.file}` } };
                }
                return s;
            }),
            setVrmFile: (file) => set(s => ({ state: { ...s.state, vrmFile: file, vrmUrl: URL.createObjectURL(file) } })),
            setThumbnail: (id, dataUrl) => set(s => ({ state: { ...s.state, thumbnailCache: { ...s.state.thumbnailCache, [id]: dataUrl } } })),
            setAnimation: (filename) => set(s => ({ state: { ...s.state, animationUrl: `animations/${filename}`, animationFile: null, isPlaying: true } })),
            setAnimationFile: (file) => set(s => ({ state: { ...s.state, animationFile: file, animationUrl: URL.createObjectURL(file), isPlaying: true } })),
            setAnimationSpeed: (speed) => set(s => ({ state: { ...s.state, animationSpeed: speed } })),
            togglePlay: () => set(s => ({ state: { ...s.state, isPlaying: !s.state.isPlaying } })),
            setCameraMode: (mode) => set(s => ({ state: { ...s.state, cameraMode: mode } })),
            setViewMode: (mode) => set(s => ({ state: { ...s.state, viewMode: mode } })),
            toggleListening: () => set(s => ({ state: { ...s.state, isListening: !s.state.isListening } })),
            setVoiceStatus: (status) => set(s => ({ state: { ...s.state, voiceStatus: status } })),
            addMessage: (msg) => set(s => ({ state: { ...s.state, chatMessages: [...s.state.chatMessages, msg] } })),
            setChatProcessing: (processing) => set(s => ({ state: { ...s.state, isChatProcessing: processing } })),
            clearChat: () => set(s => ({ state: { ...s.state, chatMessages: [{ role: 'assistant', content: 'History cleared.' }] } })),
            setTranscript: (text) => set(s => ({ state: { ...s.state, currentTranscript: text } })),
            setWidgetSettings: (settings) => set(s => {
                // @ts-ignore
                window.athena?.broadcastState?.({ type: 'settings', payload: settings });
                return { state: { ...s.state, widgetSettings: settings } };
            }),
            toggleSettings: (open) => set(s => ({ state: { ...s.state, showSettings: open ?? !s.state.showSettings } })),
            setUserProfile: (profile) => set(s => ({ state: { ...s.state, userProfile: profile } })),
            setPluginConfig: (config) => set(s => ({ state: { ...s.state, pluginConfig: config } })),
            setAiConfig: (config) => set(s => ({ state: { ...s.state, aiConfig: config } })),
            setSceneSettings: (settings) => set(s => ({ state: { ...s.state, sceneSettings: { ...s.state.sceneSettings, ...settings } } })),
            toggleLeftCollapse: () => set(s => ({ state: { ...s.state, isLeftCollapsed: !s.state.isLeftCollapsed } })),
            toggleRightCollapse: () => set(s => ({ state: { ...s.state, isRightCollapsed: !s.state.isRightCollapsed } })),
            updateLastMessage: (msg) => set(s => {
                const newHistory = [...s.state.chatMessages];
                const lastIdx = newHistory.length - 1;
                if (lastIdx >= 0) newHistory[lastIdx] = { ...newHistory[lastIdx], ...msg };
                return { state: { ...s.state, chatMessages: newHistory } };
            }),
            refreshRagStatus: async () => {
                // @ts-ignore
                if (window.athena?.rag?.getStatus) {
                    // @ts-ignore
                    const status = await window.athena.rag.getStatus();
                    set(s => ({ state: { ...s.state, ragStatus: status } }));
                }
            },
            setCameraDeviceId: (id) => set(s => ({ state: { ...s.state, cameraDeviceId: id } })),
            setCurrentAnimation: (anim) => set(s => ({ state: { ...s.state, currentAnimation: anim } })),
            setDownloadingModels: (models) => set(s => ({ state: { ...s.state, downloadingModels: models } })),
            startModelPull: (model) => {
                set(s => ({ state: { ...s.state, downloadingModels: { ...s.state.downloadingModels, [model.name]: { progress: 0, status: 'Initializing...' } } } }));
                aiModuleManager.pullModel(model, (progress) => {
                    const percent = (progress.completed && progress.total) ? Math.round((progress.completed / progress.total) * 100) : 0;
                    set(s => {
                        if (progress.status === "success" || progress.status === "error") {
                            const next = { ...s.state.downloadingModels };
                            delete next[model.name];
                            return { state: { ...s.state, downloadingModels: next } };
                        }
                        return { state: { ...s.state, downloadingModels: { ...s.state.downloadingModels, [model.name]: { progress: percent, status: progress.status } } } };
                    });
                });
            },
            addTimer: addTimerImpl,
            removeTimer: (id) => set(s => ({ state: { ...s.state, activeTimers: s.state.activeTimers.filter(t => t.id !== id) } })),
            setChatMessages: (messages) => set(s => ({ state: { ...s.state, chatMessages: messages } })),
            setActiveTimers: (timers) => set(s => ({ state: { ...s.state, activeTimers: typeof timers === 'function' ? timers(s.state.activeTimers) : timers } })),
            setActiveSidecars: (sidecars) => set(s => ({ state: { ...s.state, activeSidecars: typeof sidecars === 'function' ? sidecars(s.state.activeSidecars) : sidecars } })),
            setRagStatus: (status) => set(s => ({ state: { ...s.state, ragStatus: status } }))
        }
    };
});
