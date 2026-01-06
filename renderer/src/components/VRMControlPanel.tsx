import * as React from "react";
import { Box } from "lucide-react";
import ThreeStage from "./ThreeStage";
import type { ThreeStageHandle } from "./ThreeStage";
import { SidePanel } from "./SidePanel";
import { SettingsDialog } from "./SettingsDialog";
import { ChatPanel } from "./ChatPanel";
import { ExhibitionPage } from "./ExhibitionPage";
import { useAppStore } from "../context/AppContext";
import { useSpeechManager } from "../hooks/useSpeechManager";
import { useAssistant } from "../hooks/useAssistant";
import { useGlobalShortcuts } from "../hooks/useGlobalShortcuts";

interface VRMControlPanelProps {
    onOpenWidget?: () => void;
}

export function VRMControlPanel({ onOpenWidget }: VRMControlPanelProps) {
    const { state, actions } = useAppStore();
    const stageRef = React.useRef<ThreeStageHandle>(null);

    // 1. Assistant Logic (LLM + TTS)
    const { processInput } = useAssistant();

    // 2. Speech Result Handler (Bridge between Speech and Assistant)
    const handleSpeechResult = React.useCallback(async (text: string) => {
        actions.addMessage({ role: 'user', content: text });
        await processInput(text, {
            source: 'voice',
            onPlayAudio: async (blob) => {
                if (stageRef.current) await stageRef.current.playAudio(blob);
            }
        });
    }, [actions, processInput]);

    // 3. Speech Manager
    const { toggleListening } = useSpeechManager(handleSpeechResult);

    // 4. Global Shortcuts
    useGlobalShortcuts(toggleListening);

    // 5. Chat Panel Handler
    const handleTextSubmit = React.useCallback(async (text: string) => {
        actions.addMessage({ role: 'user', content: text });
        await processInput(text, {
            source: 'text',
            onPlayAudio: async (blob: Blob, animation?: string) => {
                // @ts-ignore - Handle updated signature
                if (stageRef.current) await stageRef.current.playAudio(blob, animation);
            }
        });
    }, [processInput]);


    return (
        <div
            className="font-sans h-screen w-screen bg-black overflow-hidden relative grid transition-all duration-300 ease-in-out"
            style={{
                gridTemplateColumns: `${state.isLeftCollapsed ? '70px' : '280px'} minmax(0, 1fr) ${state.isRightCollapsed ? '60px' : '320px'}`
            }}
        >
            {/* Left Side Panel */}
            <aside className="h-full z-10 relative border-r border-white/5 bg-black/40 backdrop-blur-md overflow-hidden">
                <SidePanel
                    onToggleListening={toggleListening}
                    onVrmUpload={() => { }} // TODO: Implement file handlers in Context if needed, or keep passing helpers
                    onAnimationUpload={() => { }}
                />
            </aside>

            {/* Center Stage */}
            <main className="relative h-full w-full bg-black/50 z-0 overflow-hidden">
                <ThreeStage
                    ref={stageRef}
                    vrmUrl={state.vrmUrl}
                    animationUrl={state.animationUrl}
                    animationSpeed={state.animationSpeed} // Context uses number, ThreeStage might expect array? check
                    cameraMode={state.cameraMode}
                    isPlaying={state.isPlaying}
                    lightIntensity={1}
                    cameraFov={50}
                    gridVisible={true}
                    shadowsEnabled={true}
                    backgroundColor="#050510"
                    onDrop={(f) => actions.setVrmFile(f)}
                />

                {/* Floating Buttons */}
                <div className="absolute top-4 right-4 z-20 flex gap-3">
                    <button onClick={onOpenWidget} className="btn-glass px-3 py-2 text-xs font-mono uppercase text-purple-300 hover:text-white flex gap-2">
                        <Box className="size-4" /> Widget
                    </button>
                </div>
            </main>

            {/* Right Chat Panel */}
            <aside className="h-full z-10 relative border-l border-white/5 bg-black/40 backdrop-blur-md overflow-hidden">
                <ChatPanel
                    onSendMessage={handleTextSubmit}
                    onClearHistory={actions.clearChat}
                />
            </aside>

            {/* --- Overlays --- */}
            <SettingsDialog
                isOpen={state.showSettings}
                onClose={() => actions.toggleSettings(false)}
                settings={state.widgetSettings}
                onUpdate={actions.setWidgetSettings}
            />

            {state.viewMode === 'exhibition' && (
                <ExhibitionPage
                    onCancel={() => actions.setViewMode('chat')}
                    onSelect={(id) => {
                        actions.setModel(id);
                        actions.setViewMode('chat');
                    }}
                    initialModelId={state.selectedCharacter.id}
                />
            )}
        </div>
    );
}
