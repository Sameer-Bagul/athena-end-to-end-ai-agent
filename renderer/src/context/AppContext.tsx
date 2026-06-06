import * as React from "react";
import { useAppStore } from "./store";
import type { AppState, AppActions, ActiveTimer, UserProfile, PluginConfig, SceneSettings, AiConfig, AiProviderType } from "./store";

export type { AppState, AppActions, ActiveTimer, UserProfile, PluginConfig, SceneSettings, AiConfig, AiProviderType };
export { useAppStore };

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { state, actions } = useAppStore();

    // Initial load
    React.useEffect(() => {
        actions.refreshRagStatus();
    }, [actions.refreshRagStatus]);

    // Persistence effects
    React.useEffect(() => { localStorage.setItem("athena-thumbnail-cache", JSON.stringify(state.thumbnailCache)); }, [state.thumbnailCache]);
    React.useEffect(() => { localStorage.setItem("athena-widget-settings", JSON.stringify(state.widgetSettings)); }, [state.widgetSettings]);
    React.useEffect(() => { localStorage.setItem("athena-user-profile", JSON.stringify(state.userProfile)); }, [state.userProfile]);
    React.useEffect(() => { localStorage.setItem("athena-plugin-config", JSON.stringify(state.pluginConfig)); }, [state.pluginConfig]);
    React.useEffect(() => { localStorage.setItem("athena-ai-config", JSON.stringify(state.aiConfig)); }, [state.aiConfig]);
    React.useEffect(() => { localStorage.setItem("athena-scene-settings", JSON.stringify(state.sceneSettings)); }, [state.sceneSettings]);
    React.useEffect(() => { localStorage.setItem("athena-camera-id", state.cameraDeviceId); }, [state.cameraDeviceId]);

    // Load Chat History
    React.useEffect(() => {
        const loadHistory = async () => {
            // @ts-ignore
            if (window.athena?.loadChatHistory) {
                // @ts-ignore
                const history = await window.athena.loadChatHistory();
                if (history?.length) {
                    actions.setChatMessages(history);
                } else {
                    const name = state.userProfile.name || "there";
                    actions.setChatMessages([{ role: 'assistant', content: `Hello ${name}! I'm Athena. It's great to see you. Is there anything I can help you with?` }]);
                }
            }
        };
        loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save Chat History
    React.useEffect(() => {
        if (state.chatMessages.length > 0) {
            // @ts-ignore
            window.athena?.saveChatHistory?.(state.chatMessages);
        }
    }, [state.chatMessages]);

    // Timer Interval Management
    React.useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            actions.setActiveTimers((prev: ActiveTimer[]) => {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Bridge Listeners ---
    React.useEffect(() => {
        const handleAddTimer = (e: any) => {
            const { duration, unit, label } = e.detail;
            actions.addTimer(duration, unit, label);
        };
        window.addEventListener('athena:add-timer' as any, handleAddTimer);

        // @ts-ignore
        const unAdd = window.athena.agent?.onAddTimer?.((data: any) => {
            actions.addTimer(data.duration, data.unit, data.label);
        });

        // @ts-ignore
        const unRemove = window.athena.agent?.onRemoveTimer?.((data: any) => {
            actions.removeTimer(data.id);
        });

        // @ts-ignore
        const unMcp = window.athena.agent?.onMcpStatus?.((data: { name: string, status: 'started' | 'stopped' }) => {
            actions.setActiveSidecars((prev: string[]) => {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <>{children}</>;
};
