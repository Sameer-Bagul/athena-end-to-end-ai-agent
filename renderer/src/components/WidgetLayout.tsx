import { useState, useRef, useEffect } from "react";
import { X, Box } from "lucide-react";
import ThreeStage from "./ThreeStage";
import { AVAILABLE_MODELS } from "../lib/models";
import { SpeechRecognitionManager } from "../lib/SpeechRecognition";
import type { ThreeStageHandle } from "./ThreeStage";

export function WidgetLayout() {
    // Load State from LocalStorage (Sync-ish)
    // Note: Only loads ONCE on startup. Real-time sync requires more complex IPC/Storage listeners.
    // For V1, this is "good enough" - opens with your current settings.

    const [selectedCharacter] = useState(() => {
        // Strategy: We could store "currentModelId" in localStorage in main app updates
        // For now, let's just pick default or try to read last saved.
        // Let's presume the main app is saving 'athena-last-model' or similar? 
        // Actually, VRMControlPanel.tsx defaults to index 0. 
        return AVAILABLE_MODELS[0];
    });

    const [vrmUrl, setVrmUrl] = useState(`models/${selectedCharacter.file}`);

    // --- PTT Logic ---
    const speechManager = useRef(new SpeechRecognitionManager());

    useEffect(() => {
        speechManager.current.setMode('ptt');

        const unsubscribeShortcut = window.athena?.onShortcutEvent((type) => {
            if (type === 'pressed') {
                if (!speechManager.current.isActive()) {
                    console.log("Widget: PTT Start");
                    speechManager.current.start({
                        onResult: (text) => {
                            console.log("Widget: Input:", text);
                            if (window.athena.sendWidgetInput) {
                                window.athena.sendWidgetInput(text);
                            }
                        }
                    });
                }
            }
        });

        const handleKeyUp = (e: KeyboardEvent) => {
            // Check for Space. We don't strictly check Alt here because OS might eat it or 
            // global shortcut might release focus in weird ways. But 'Space' release is the trigger.
            if (e.code === 'Space') {
                if (speechManager.current.isActive()) {
                    console.log("Widget: PTT Stop");
                    speechManager.current.stop();
                }
            }
        };
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            unsubscribeShortcut?.();
            window.removeEventListener('keyup', handleKeyUp);
            speechManager.current.stop(true);
        };
    }, []);

    // --- Settings State ---
    const [settings, setSettings] = useState({
        zoom: 0.5, // Default zoom roughly matches previous 'cameraFov' logic or simpler scale logic
        // Actually, changing FOV is better for zoom. 
        // Or distance. 
        // Previously: cameraFov={18} (very zoomed in telephoto).
        // Let's map zoom 1.0 -> FOV 18?
        // Let's store settings raw.
        opacity: 0, // Fully transparent
        blur: 0,
        borderRadius: 50, // Circle
        size: 300,
    });

    // --- State Sync Listener ---
    useEffect(() => {
        if (!window.athena?.onSyncReceive) return;

        const unsubscribe = window.athena.onSyncReceive((data: any) => {
            // console.log("[Widget] Recieved Sync Data:", data.type);

            if (data.type === 'model') {
                const profileId = data.payload.id;
                const profile = AVAILABLE_MODELS.find(p => p.id === profileId);
                if (profile) setVrmUrl(`models/${profile.file}`);
            } else if (data.type === 'audio') {
                const buffer = data.payload;
                const blob = new Blob([buffer], { type: 'audio/wav' });
                if (stageRef.current) stageRef.current.playAudio(blob, true);
            } else if (data.type === 'settings') {
                // Apply Settings
                setSettings(data.payload);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Force transparency for this window via style injection (Keep this)
    if (typeof document !== 'undefined') {
        const style = document.createElement('style');
        style.innerHTML = `
            html, body, #root {
                background: transparent !important;
                background-image: none !important;
                background-color: transparent !important;
                overflow: hidden !important;
            }
        `;
        document.head.appendChild(style);
    }

    // State
    const [isHovered, setIsHovered] = useState(false);
    const stageRef = useRef<ThreeStageHandle>(null);

    // Close Handler
    const handleClose = async () => {
        await window.athena.closeWidget();
    };

    // Calculate Dynamic Styles
    const containerStyle = {
        width: '100vw', // Always fill window, window itself resizes
        height: '100vh',
        borderRadius: `${settings.borderRadius}%`,
        backgroundColor: `rgba(0,0,0, ${settings.opacity})`, // Simple black tint
        backdropFilter: settings.blur > 0 ? `blur(${settings.blur}px)` : 'none',
        WebkitAppRegion: 'drag', // Helper for dragging entire shape
    } as React.CSSProperties;


    // Map "Zoom" to FOV (Inverse relationship) or Distance
    // Zoom 1 = FOV 18 (default face)
    // Zoom 0.5 = FOV 36 (wider)
    // Zoom 2 = FOV 9 (closer)
    const currentFov = 18 / (settings.zoom || 0.5); // Default start 0.5 if invalid? No, init state is defined.


    return (
        <div
            className="relative overflow-hidden transition-all duration-300 ease-out"
            style={containerStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Close Button (No Drag) */}
            {isHovered && (
                <div className="absolute top-4 right-4 z-[60]" style={{ WebkitAppRegion: 'no-drag' } as any}>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-full bg-black/60 text-white/70 hover:text-red-400 hover:bg-black/80 transition-all backdrop-blur-md"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* 3D Stage */}
            <div className="absolute inset-0 z-0 pointer-events-none" style={{ borderRadius: 'inherit' }}>
                <ThreeStage
                    ref={stageRef}
                    vrmUrl={vrmUrl}
                    animationUrl={undefined}
                    isPlaying={false}
                    animationSpeed={0.4}
                    lightIntensity={1}
                    cameraFov={currentFov}
                    shadowsEnabled={false}
                    gridVisible={false}
                    environmentVisible={false}
                    backgroundColor="transparent"
                    cameraMode="face"
                    onThumbnailGenerated={() => { }}
                />
            </div>

            {/* Fallback visual if loading */}
            {!vrmUrl && (
                <div className="flex items-center justify-center h-full w-full text-cyan-500 animate-pulse">
                    <Box className="w-8 h-8" />
                </div>
            )}
        </div>
    );
}
