import * as React from "react";
import { Box, ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";
import { animationFacialMap } from "../lib/facialMapping";
import { selectAnimationAndExpression } from "../lib/aiAnimationSelector";
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

interface VRMControlPanelProps {
    onOpenWidget?: () => void;
}

export function VRMControlPanel({ onOpenWidget }: VRMControlPanelProps) {

    // Track last AI selection for UI
    const [aiSelection, setAiSelection] = React.useState<{ animation: string, facialExpressions: any[] }>({ animation: '', facialExpressions: [] });
    const { state, actions } = useAppStore();
    const stageRef = React.useRef<ThreeStageHandle>(null);

    // 1. Assistant Logic (LLM + TTS)
    const { processInput } = useAssistant();

    // 2. Speech Result Handler (Bridge between Speech and Assistant)
    const handleSpeechResult = React.useCallback(async (text: string) => {
        actions.addMessage({ role: 'user', content: text });
        await processInput(text, {
            source: 'voice',
            onPlayAudio: async (blob: Blob, animation?: string, facialExpressions?: any[]) => {
                if (stageRef.current) await stageRef.current.playAudio(blob, animation, facialExpressions);
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
        // Get AI selection for preview
        const { animation, facialExpressions } = selectAnimationAndExpression(text);
        setAiSelection({ animation, facialExpressions });
        await processInput(text, {
            source: 'text',
            onPlayAudio: async (blob: Blob, animation?: string, facialExpressions?: any[]) => {
                if (stageRef.current) await stageRef.current.playAudio(blob, animation, facialExpressions);
            }
        });
    }, [actions, processInput]);
    // 6. Resizable Chat Panel logic
    const [chatWidth, setChatWidth] = React.useState(320);
    const isResizing = React.useRef(false);
    const [overrideAnim, setOverrideAnim] = React.useState<string | null>(null);
    const [overrideFace, setOverrideFace] = React.useState<any[] | null>(null);

    const startResizing = React.useCallback(() => {
        isResizing.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'col-resize';
    }, []);

    const stopResizing = React.useCallback(() => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'default';
    }, []);

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
        if (!isResizing.current) return;
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 280 && newWidth < 800) {
            setChatWidth(newWidth);
        }
    }, []);


    return (
        <div
            className="font-sans h-screen w-screen bg-black overflow-hidden relative flex flex-row items-stretch"
        >
            {/* Left Side Panel */}
            <aside
                className={cn(
                    "h-full z-20 relative border-r border-white/5 bg-black/60 backdrop-blur-2xl shadow-2xl transition-all duration-500 flex flex-col overflow-hidden",
                    state.isLeftCollapsed ? "w-[70px]" : "w-[280px]"
                )}
            >
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                    <SidePanel
                        onToggleListening={toggleListening}
                        onVrmUpload={() => { }}
                        onAnimationUpload={() => { }}
                        onExpressionChange={(name, value) => {
                            if (stageRef.current && stageRef.current.animationManager) {
                                stageRef.current.animationManager.setExpression(name, value);
                            }
                        }}
                    />
                    {/* Facial Expression Mapping UI - Integrated into scrollable area */}
                    <div className="p-4 border-t border-white/10 shrink-0">
                        <h3 className="text-[10px] font-mono text-white/40 mb-2 uppercase tracking-widest">AI Status</h3>
                        <div className="space-y-4">
                            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-none">
                                <div className="font-mono text-[9px] text-white/30 mb-2">ANIM: {aiSelection.animation}</div>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {aiSelection.facialExpressions.map((expr, idx) => (
                                        <span key={idx} className="px-1.5 py-0.5 border border-white/10 text-white/50 text-[8px] font-mono">
                                            {expr.name}
                                        </span>
                                    ))}
                                </div>
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[8px] text-white/20 uppercase font-bold">Override Anim</label>
                                        <select
                                            value={overrideAnim ?? aiSelection.animation}
                                            onChange={e => setOverrideAnim(e.target.value)}
                                            className="bg-black text-white/60 text-[10px] border border-white/10 px-2 py-1.5 outline-none focus:border-white transition-colors"
                                        >
                                            {Object.keys(animationFacialMap).map(anim => (
                                                <option key={anim} value={anim}>{anim}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[8px] text-white/20 uppercase font-bold">Override Facial</label>
                                        <select
                                            value={overrideFace ? JSON.stringify(overrideFace) : JSON.stringify(aiSelection.facialExpressions)}
                                            onChange={e => setOverrideFace(JSON.parse(e.target.value))}
                                            className="bg-black text-white/60 text-[10px] border border-white/10 px-2 py-1.5 outline-none focus:border-white transition-colors"
                                        >
                                            {Object.entries(animationFacialMap).map(([anim, exprs]) => (
                                                <option key={anim} value={JSON.stringify(exprs)}>{anim}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Center Stage */}
            <main className="relative flex-1 h-full bg-[#050510] z-0 overflow-hidden min-w-0">
                <ThreeStage
                    ref={stageRef}
                    vrmUrl={state.vrmUrl}
                    animationUrl={state.animationUrl}
                    animationSpeed={state.animationSpeed}
                    cameraMode={state.cameraMode}
                    isPlaying={state.isPlaying}
                    lightIntensity={1}
                    cameraFov={50}
                    gridVisible={true}
                    shadowsEnabled={true}
                    backgroundColor="#050510"
                    onDrop={(f) => actions.setVrmFile(f)}
                />

                {/* Overlays / UI Buttons */}
                <div className="absolute top-8 left-8 z-10">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={actions.toggleLeftCollapse}
                        className="size-10 rounded-none bg-black/40 backdrop-blur-md border border-white/10 text-white/50 hover:text-white transition-all shadow-2xl"
                    >
                        <ChevronLeft className={cn("size-6 transition-transform duration-500", state.isLeftCollapsed && "rotate-180")} />
                    </Button>
                </div>

                {/* Floating Widget Toggle */}
                <div className="absolute top-8 right-8 z-20 flex gap-3">
                    <button onClick={onOpenWidget} className="btn-glass px-4 py-2 rounded-none bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-mono uppercase text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex gap-2 items-center">
                        <Box className="size-3.5" /> Widget
                    </button>
                </div>
            </main>

            {/* Resize Handle */}
            {!state.isRightCollapsed && (
                <div
                    onMouseDown={startResizing}
                    className="w-[1px] bg-white/5 hover:bg-white/20 cursor-col-resize z-40 transition-colors"
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
