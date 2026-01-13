import * as React from "react";
import { Box } from "lucide-react";
import { animationFacialMap } from "../lib/facialMapping";
import { selectAnimationAndExpression } from "../lib/aiAnimationSelector";
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
    // UI override controls
    const [overrideAnim, setOverrideAnim] = React.useState<string | null>(null);
    const [overrideFace, setOverrideFace] = React.useState<any[] | null>(null);


    return (
        <div
            className="font-sans h-screen w-screen bg-black overflow-hidden relative grid transition-all duration-300 ease-in-out"
            style={{
                gridTemplateColumns: `${state.isLeftCollapsed ? '70px' : '280px'} minmax(0, 1fr) ${state.isRightCollapsed ? '60px' : '320px'}`
            }}
        >
            {/* Left Side Panel */}
            <aside className="h-full z-20 relative border-r border-white/5 bg-black/60 backdrop-blur-2xl overflow-hidden shadow-2xl">
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
                {/* Facial Expression Mapping UI */}
                <div className="p-4 border-t border-white/10">
                    <h3 className="text-xs font-mono text-cyan-400 mb-2">AI Animation & Facial Expression</h3>
                    <div className="space-y-2">
                        <div className="bg-black/40 rounded-lg p-2 border border-cyan-900">
                            <div className="font-mono text-xs text-cyan-300 mb-1">AI Selected Animation: {aiSelection.animation}</div>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {aiSelection.facialExpressions.map((expr, idx) => (
                                    <span key={idx} className="px-2 py-1 rounded bg-cyan-800/60 text-cyan-100 text-[10px] font-mono">
                                        {expr.name} ({expr.value}){expr.duration ? ` for ${expr.duration}ms` : ''}
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2 items-center">
                                <label className="text-xs text-white/40">Override Animation:</label>
                                <select value={overrideAnim ?? aiSelection.animation} onChange={e => setOverrideAnim(e.target.value)} className="bg-black/60 text-cyan-200 text-xs rounded px-2 py-1">
                                    {Object.keys(animationFacialMap).map(anim => (
                                        <option key={anim} value={anim}>{anim}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 items-center mt-2">
                                <label className="text-xs text-white/40">Override Facial:</label>
                                <select value={overrideFace ? JSON.stringify(overrideFace) : JSON.stringify(aiSelection.facialExpressions)} onChange={e => setOverrideFace(JSON.parse(e.target.value))} className="bg-black/60 text-cyan-200 text-xs rounded px-2 py-1">
                                    {Object.entries(animationFacialMap).map(([anim, exprs]) => (
                                        <option key={anim} value={JSON.stringify(exprs)}>{anim}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Center Stage */}
            <main className="relative h-full w-full bg-[#050510] z-0 overflow-hidden">
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
                    <button onClick={onOpenWidget} className="btn-glass px-4 py-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-xs font-mono uppercase text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex gap-2 items-center">
                        <Box className="size-3.5" /> Widget
                    </button>
                </div>
            </main>

            {/* Right Chat Panel */}
            <aside className="h-full z-20 relative border-l border-white/5 bg-black/60 backdrop-blur-2xl overflow-hidden shadow-2xl">
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
