import * as React from "react";
import { Box, ChevronLeft } from "lucide-react";
import { cn } from "../lib/utils";
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
import { ActiveTimerUI } from "./ActiveTimerUI";
import { McpStatusUI } from "./McpStatusUI";

interface VRMControlPanelProps {
    onOpenWidget?: () => void;
}

export function VRMControlPanel({ onOpenWidget }: VRMControlPanelProps) {
    console.log('[VRMControlPanel] Component rendering...');

    const { state, actions } = useAppStore();
    const stageRef = React.useRef<ThreeStageHandle>(null);

    console.log('[VRMControlPanel] State loaded:', {
        viewMode: state.viewMode,
        isLeftCollapsed: state.isLeftCollapsed,
        isRightCollapsed: state.isRightCollapsed
    });

    // 1. Assistant Logic (LLM + TTS)
    const { processInput } = useAssistant();

    // 2. Speech Result Handler (Bridge between Speech and Assistant)
    const handleSpeechResult = React.useCallback(async (text: string) => {
        actions.addMessage({ role: 'user', content: text });
        await processInput(text, [], {
            source: 'voice',
            onPlayAudio: async (blob: Blob | null, animation?: string, facialExpressions?: Array<{ name: string; value: number }>) => {
                if (stageRef.current) await stageRef.current.playAudio(blob, animation, facialExpressions);
            }
        });
    }, [actions, processInput]);

    // 3. Speech Manager
    const { toggleListening } = useSpeechManager(handleSpeechResult);

    // 4. Global Shortcuts
    useGlobalShortcuts(toggleListening);

    // 5. Chat Panel Handler
    const handleTextSubmit = React.useCallback(async (text: string, attachments: any[] = []) => {
        actions.addMessage({ role: 'user', content: text, attachments });
        await processInput(text, attachments, {
            source: 'text',
            onPlayAudio: async (blob: Blob | null, animation?: string, facialExpressions?: Array<{ name: string; value: number }>) => {
                if (stageRef.current) await stageRef.current.playAudio(blob, animation, facialExpressions);
            }
        });
    }, [actions, processInput]);

    const handleVrmDrop = React.useCallback((f: File) => {
        actions.setVrmFile(f);
    }, [actions]);

    const handleExpressionChange = React.useCallback((name: string, value: number) => {
        if (stageRef.current && stageRef.current.animationManager) {
            stageRef.current.animationManager.setExpression(name, value);
        }
    }, []);

    // 6. Resizable Chat Panel logic
    const [chatWidth, setChatWidth] = React.useState(600);
    const isResizing = React.useRef(false);

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
        if (!isResizing.current) return;
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 280 && newWidth < 800) {
            setChatWidth(newWidth);
        }
    }, []);

    const stopResizing = React.useCallback(() => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.body.style.cursor = 'default';
    }, [handleMouseMove]);

    React.useEffect(() => {
        const handleMouseUp = () => stopResizing();
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [stopResizing]);

    const startResizing = React.useCallback(() => {
        isResizing.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'col-resize';
    }, [handleMouseMove, stopResizing]);


    return (
        <div
            className="font-sans h-screen w-screen bg-[#050505] overflow-hidden relative flex flex-row items-stretch"
        >
            {/* Left Side Panel */}
            <aside
                className={cn(
                    "h-full z-20 relative transition-all duration-700 ease-in-out flex flex-col overflow-hidden",
                    state.isLeftCollapsed ? "w-0 border-none px-0" : "w-90 border-r border-white/3"
                )}
            >
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                    <SidePanel
                        onToggleListening={toggleListening}
                        onVrmUpload={() => { }}
                        onAnimationUpload={() => { }}
                        onExpressionChange={handleExpressionChange}
                    />

                </div>
            </aside>

            {/* Center Stage */}
            <main className="relative flex-1 h-full bg-[#020205] z-0 overflow-hidden min-w-0">
                <ThreeStage
                    ref={stageRef}
                    vrmUrl={state.vrmUrl}
                    animationUrl={state.animationUrl}
                    animationSpeed={state.animationSpeed}
                    cameraMode={state.cameraMode}
                    isPlaying={state.isPlaying}
                    lightIntensity={1.2}
                    cameraDeviceId={state.cameraDeviceId}
                    cameraFov={45}
                    gridVisible={false}
                    shadowsEnabled={true}
                    backgroundColor="#020205"
                    onDrop={handleVrmDrop}
                />

                <ActiveTimerUI />
                <McpStatusUI />

                {/* Overlays / UI Buttons */}
                <div className="absolute top-8 left-8 z-10">
                    <button
                        onClick={actions.toggleLeftCollapse}
                        className="size-10 flex items-center justify-center rounded-full bg-white/2 hover:bg-white/5 border border-white/5 text-white/20 hover:text-white transition-all backdrop-blur-md"
                    >
                        <ChevronLeft className={cn("size-5 transition-transform duration-700", state.isLeftCollapsed && "rotate-180")} />
                    </button>
                </div>

                {/* Floating Widget Toggle */}
                <div className="absolute top-8 right-8 z-20 flex gap-3">
                    <button onClick={onOpenWidget} className="px-4 py-2 rounded-full bg-white/2 hover:bg-white/5 border border-white/5 text-[10px] font-medium text-white/30 hover:text-white transition-all backdrop-blur-md flex gap-2 items-center">
                        <Box className="size-3.5" /> Widget
                    </button>
                </div>
            </main>

            {/* Resize Handle */}
            {!state.isRightCollapsed && (
                <div
                    onMouseDown={startResizing}
                    className="w-px bg-white/5 hover:bg-white/20 cursor-col-resize z-40 transition-colors"
                />
            )}

            {/* Right Chat Panel */}
            <aside
                className={cn(
                    "h-full z-30 relative transition-all duration-500 ease-in-out overflow-hidden",
                    state.isRightCollapsed ? "w-0" : "border-l border-white/5 shadow-2xl"
                )}
                style={{ width: state.isRightCollapsed ? 0 : chatWidth }}
            >
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
