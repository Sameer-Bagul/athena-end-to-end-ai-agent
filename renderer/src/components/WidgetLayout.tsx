import { useState, useRef } from "react";
import { X, Box } from "lucide-react";
import ThreeStage from "./ThreeStage";
import { AVAILABLE_MODELS } from "../lib/models";
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

    const [vrmUrl] = useState(`models/${selectedCharacter.file}`);



    // Force transparency for this window via style injection
    // This overrides tailwind base styles on body/html
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

    // State
    const [isHovered, setIsHovered] = useState(false);
    const stageRef = useRef<ThreeStageHandle>(null);

    // Close Handler
    const handleClose = async () => {
        await window.athena.closeWidget();
    };

    return (
        <div
            className="h-screen w-screen relative overflow-hidden rounded-[50%]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Drag Handle (Full Overlay) */}
            <div
                className="absolute inset-0 z-50 rounded-[50%]"
                style={{ WebkitAppRegion: 'drag' } as any}
            />

            {/* Close Button (No Drag) */}
            {isHovered && (
                <div className="absolute top-2 right-2 z-[60]" style={{ WebkitAppRegion: 'no-drag' } as any}>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-full bg-black/60 text-white/70 hover:text-red-400 hover:bg-black/80 transition-all backdrop-blur-md"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* 3D Stage */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <ThreeStage
                    ref={stageRef}
                    vrmUrl={vrmUrl}
                    animationUrl={undefined}
                    isPlaying={false} // False = Static Stand Pose (Fixes T-Pose)
                    animationSpeed={0.4}
                    lightIntensity={1}
                    cameraFov={18} // Extreme zoom for face portrait
                    shadowsEnabled={false} // Performance
                    gridVisible={false}
                    environmentVisible={false}
                    backgroundColor="transparent" // Explicit transparent string
                    cameraMode="face" // Force face mode
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
