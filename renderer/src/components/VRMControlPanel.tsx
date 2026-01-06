import * as React from "react";
import { Box } from "lucide-react";
import ThreeStage from "./ThreeStage";
import type { ThreeStageHandle } from "./ThreeStage";
import { SidePanel } from "./SidePanel";
import { SettingsDialog } from "./SettingsDialog";
import { ChatPanel } from "./ChatPanel";
import { ExhibitionPage } from "./ExhibitionPage";
import { useAppStore } from "../context/AppContext";
import { SpeechRecognitionManager } from "../lib/SpeechRecognition";
import { sendMessageToOllama, generateSpeech } from "../lib/api";

interface VRMControlPanelProps {
    onOpenWidget?: () => void;
}

export function VRMControlPanel({ onOpenWidget }: VRMControlPanelProps) {
    const { state, actions } = useAppStore();

    // Refs (Still local as they are implementation details or DOM/Three refs)
    const speechManagerRef = React.useRef<SpeechRecognitionManager | null>(null);
    const abortControllerRef = React.useRef<AbortController | null>(null);
    const stageRef = React.useRef<ThreeStageHandle>(null);

    // Initialize Speech Logic (Move to Context later? for now bridge it)
    // We need to sync local SpeechManager events to Context State
    React.useEffect(() => {
        speechManagerRef.current = new SpeechRecognitionManager();
        return () => {
            speechManagerRef.current?.stop();
            abortControllerRef.current?.abort();
            actions.setChatProcessing(false);
        }
    }, []);

    // Handle Listening Toggle Bridge
    const handleToggleListening = () => {
        // If active, stop
        if (state.isListening) {
            speechManagerRef.current?.stop();
            actions.toggleListening(); // Updates state to false
            actions.setVoiceStatus("idle");
        } else {
            // Start
            actions.toggleListening(); // Updates state to true
            actions.setVoiceStatus("listening");
            speechManagerRef.current?.start({
                onResult: handleSpeechResult,
                onStatusChange: (s) => actions.setVoiceStatus(s as any),
                onError: (e) => console.error(e)
            });
        }
    };

    const handleSpeechResult = async (text: string) => {
        actions.addMessage({ role: 'user', content: text });
        await handleChatSubmit(text);
    };

    const handleChatSubmit = async (text: string) => {
        actions.setChatProcessing(true);
        try {
            // LLM
            const response = await sendMessageToOllama(text);
            const aiMsg = { role: 'assistant', content: response } as const;
            actions.addMessage(aiMsg);

            // TTS
            if (state.isListening) { // Auto-speak if in voice mode
                try {
                    const audio = await generateSpeech(response, state.selectedCharacter.voiceStyle);
                    await stageRef.current?.playAudio(audio);
                } catch (e) { console.error("TTS failed", e); }
            }
        } catch (e) {
            console.error("Chat error", e);
        } finally {
            actions.setChatProcessing(false);
        }
    };


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
                    onToggleListening={handleToggleListening}
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
                    onSendMessage={handleChatSubmit}
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
