import * as React from "react";
import { Box } from "lucide-react";
import ThreeStage from "./ThreeStage";
import type { ThreeStageHandle } from "./ThreeStage";
import { AVAILABLE_MODELS } from "../lib/models";
import { ChatPanel } from "./ChatPanel";
import type { ChatMessage } from "./ChatPanel";
import { SidePanel } from "./SidePanel";
import { sendMessageToOllama, generateSpeech } from "../lib/api";
import { AnimationAction } from "../three/AnimationManager";

export function VRMControlPanel() {
  // --- State ---
  const [selectedCharacter, setSelectedCharacter] = React.useState(AVAILABLE_MODELS[0]);

  const [vrmFile, setVrmFile] = React.useState<File | null>(null);
  const [vrmUrl, setVrmUrl] = React.useState<string>(`models/${AVAILABLE_MODELS[0].file}`);
  const [animationFile, setAnimationFile] = React.useState<File | null>(null);
  const [animationUrl, setAnimationUrl] = React.useState<string>("animations/Jump.vrma");

  const [inputText, setInputText] = React.useState("");
  const [speechText, setSpeechText] = React.useState("");

  const [cameraMode, setCameraMode] = React.useState("full");
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Three.js Config
  const [animationSpeed] = React.useState([0.4]);
  const [lightIntensity] = React.useState([1]);
  const [cameraFov] = React.useState([50]);
  const [gridVisible] = React.useState(true);
  const [shadowsEnabled] = React.useState(true);
  const [backgroundColor] = React.useState("#050510"); // NOTE: Scene overrides this with gradient now

  // Chat State
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("athena-chat-history");
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', content: 'Greetings. I am Athena. How can I assist you today?' }
    ];
  });
  const [isChatProcessing, setIsChatProcessing] = React.useState(false);

  // Persistence
  React.useEffect(() => {
    localStorage.setItem("athena-chat-history", JSON.stringify(chatMessages));
  }, [chatMessages]);


  // Refs
  const stageRef = React.useRef<ThreeStageHandle>(null);

  // --- Handlers ---
  const handleSpeak = () => {
    if (inputText.trim()) {
      setSpeechText(inputText);
    }
  };

  const handleModelSelect = (profileId: string) => {
    const profile = AVAILABLE_MODELS.find(p => p.id === profileId);
    if (profile) {
      setSelectedCharacter(profile);
      setVrmFile(null);
      setVrmUrl(`models/${profile.file}`);
    }
  };

  const handleAnimationSelect = (filename: string) => {
    setAnimationFile(null);
    setAnimationUrl(`animations/${filename}`);
  };

  const handleVRMUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVrmFile(file);
      const url = URL.createObjectURL(file);
      setVrmUrl(url);
    }
  };

  const handleAnimationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnimationFile(file);
      const url = URL.createObjectURL(file);
      setAnimationUrl(url);
    }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleChatSubmit = async (text: string) => {
    // 1. Add User Message
    const userMsg: ChatMessage = { role: 'user', content: text };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatProcessing(true);

    try {
      // 2. Trigger Thinking Animation
      stageRef.current?.playAnimationAction(AnimationAction.THINKING);

      // 3. Call LLM
      const responseText = await sendMessageToOllama(text, selectedCharacter.systemPrompt);

      const aiMsg: ChatMessage = { role: 'assistant', content: responseText };
      setChatMessages(prev => [...prev, aiMsg]);

      // 4. Generate Speech & Animation
      stageRef.current?.playAnimationAction(AnimationAction.RELAX);
      const audioBlob = await generateSpeech(responseText, selectedCharacter.voiceStyle);
      stageRef.current?.playAudio(audioBlob);

    } catch (error) {
      console.error("Chat Error:", error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: "[SYSTEM ERROR: Connection Lost]" }]);
      stageRef.current?.playAnimationAction(AnimationAction.SAD);
    } finally {
      setIsChatProcessing(false);
    }
  };

  const handleClearHistory = () => {
    setChatMessages([{ role: 'assistant', content: 'History cleared. Ready for new input.' }]);
    localStorage.removeItem("athena-chat-history");
  };

  // Cleanup blob URLs
  React.useEffect(() => {
    return () => {
      if (vrmUrl && vrmUrl.startsWith("blob:")) URL.revokeObjectURL(vrmUrl);
      if (animationUrl && animationUrl.startsWith("blob:")) URL.revokeObjectURL(animationUrl);
    };
  }, [vrmUrl, animationUrl]);

  return (
    <div className="app-layout font-sans">

      {/* --- Link SidePanel (Left) --- */}
      <aside className="h-full z-10 glass-panel">
        <SidePanel
          selectedCharacter={selectedCharacter}
          onModelSelect={handleModelSelect}
          animationUrl={animationUrl}
          onAnimationSelect={handleAnimationSelect}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          inputText={inputText}
          setInputText={setInputText}
          onSpeak={handleSpeak}
          cameraMode={cameraMode}
          onCameraModeChange={setCameraMode}
          vrmFile={vrmFile}
          onVrmUpload={handleVRMUpload}
          animationFile={animationFile}
          onAnimationUpload={handleAnimationUpload}
          isChatProcessing={isChatProcessing}
        />
      </aside>

      {/* --- Center 3D Stage (50%) --- */}
      <main className="h-full relative overflow-hidden bg-black/50 z-0 border-x border-white/5">
        {/* We keep the transparent logic so the body gradient shows through, or ThreeStage renders its own env */}
        {vrmUrl ? (
          <ThreeStage
            ref={stageRef}
            vrmUrl={vrmUrl}
            animationUrl={animationUrl}
            isPlaying={isPlaying}
            animationSpeed={animationSpeed[0]}
            lightIntensity={lightIntensity[0]}
            cameraFov={cameraFov[0]}
            shadowsEnabled={shadowsEnabled}
            gridVisible={gridVisible}
            backgroundColor={backgroundColor}
            speechText={speechText}
            cameraMode={cameraMode}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center relative">
            <div className="absolute inset-0 bg-primary/5 animate-pulse-slow"></div>
            <div className="relative z-10 p-10 glass rounded-3xl flex flex-col items-center">
              <Box className="size-20 text-primary animate-float" />
              <h2 className="mt-6 text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">System Offline</h2>
              <p className="mt-2 text-muted-foreground">Select an avatar module to initiate.</p>
            </div>
          </div>
        )}
      </main>

      {/* --- Right Chat Panel (25%) --- */}
      <aside className="h-full z-10 glass-panel">
        <ChatPanel
          messages={chatMessages}
          onSendMessage={handleChatSubmit}
          onClearHistory={handleClearHistory}
          isProcessing={isChatProcessing}
        />
      </aside>

    </div>
  );
}

export default VRMControlPanel;
