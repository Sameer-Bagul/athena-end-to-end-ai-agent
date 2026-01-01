import * as React from "react";
import { Box, LayoutGrid } from "lucide-react";
import ThreeStage from "./ThreeStage";
import type { ThreeStageHandle } from "./ThreeStage";
import { AVAILABLE_MODELS } from "../lib/models";
import { ChatPanel } from "./ChatPanel";
import type { ChatMessage } from "./ChatPanel";
import { SidePanel } from "./SidePanel";
import { sendMessageToOllama, generateSpeech } from "../lib/api";
import { AnimationAction } from "../three/AnimationManager";
import { ExhibitionPage } from "./ExhibitionPage";
import { SettingsModal } from "./SettingsModal";
import type { AIConfig } from "./SettingsModal";

export function VRMControlPanel() {
  // --- State ---
  const [selectedCharacter, setSelectedCharacter] = React.useState(AVAILABLE_MODELS[0]);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const [aiConfig, setAiConfig] = React.useState<AIConfig>(() => {
    const saved = localStorage.getItem("athena-ai-config");
    return saved ? JSON.parse(saved) : {
      provider: 'ollama',
      apiKey: '',
      model: 'dolphin-mistral:latest',
      endpoint: 'http://localhost:11434'
    };
  });

  const [vrmFile, setVrmFile] = React.useState<File | null>(null);
  const [vrmUrl, setVrmUrl] = React.useState<string>(`models/${AVAILABLE_MODELS[0].file}`);
  const [vrmThumbnail, setVrmThumbnail] = React.useState<string | null>(null);

  // Thumbnail Cache
  const [thumbnailCache, setThumbnailCache] = React.useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("athena-thumbnail-cache");
    return saved ? JSON.parse(saved) : {};
  });

  const [animationFile, setAnimationFile] = React.useState<File | null>(null);
  const [animationUrl, setAnimationUrl] = React.useState<string>("animations/Jump.vrma");

  const [cameraMode, setCameraMode] = React.useState("full");
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Three.js Config
  const [animationSpeed] = React.useState([0.4]);
  const [lightIntensity] = React.useState([1]);
  const [cameraFov] = React.useState([50]);
  const [gridVisible] = React.useState(true);
  const [shadowsEnabled] = React.useState(true);
  const [backgroundColor] = React.useState("#050510");

  // Chat State
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("athena-chat-history");
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', content: 'Greetings. I am Athena. How can I assist you today?' }
    ];
  });
  const [isChatProcessing, setIsChatProcessing] = React.useState(false);

  const [viewMode, setViewMode] = React.useState<'chat' | 'exhibition'>('chat');

  // Persistence
  React.useEffect(() => {
    localStorage.setItem("athena-chat-history", JSON.stringify(chatMessages));
  }, [chatMessages]);

  React.useEffect(() => {
    try {
      localStorage.setItem("athena-thumbnail-cache", JSON.stringify(thumbnailCache));
    } catch (e) {
      console.warn("Failed to save thumbnail cache", e);
    }
  }, [thumbnailCache]);


  // Refs
  const stageRef = React.useRef<ThreeStageHandle>(null);

  // --- Handlers ---
  const handleModelSelect = (profileId: string) => {
    const profile = AVAILABLE_MODELS.find(p => p.id === profileId);
    if (profile) {
      setSelectedCharacter(profile);
      setVrmFile(null);
      setVrmThumbnail(null); // Reset custom thumbnail for presets
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
      setVrmThumbnail(null);
      const url = URL.createObjectURL(file);
      setVrmUrl(url);
    }
  };

  const handleThumbnailGenerated = React.useCallback((image: string) => {
    console.log("Thumbnail generated for:", vrmFile ? "Custom VRM" : selectedCharacter.name);
    if (vrmFile) {
      // Active model is a custom upload
      setVrmThumbnail(image);
    } else {
      // Active model is a preset
      setThumbnailCache(prev => ({
        ...prev,
        [selectedCharacter.id]: image
      }));
    }
  }, [vrmFile, selectedCharacter]);

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
    <div className="app-layout font-sans relative">

      {/* Exhibition Overlay */}
      {viewMode === 'exhibition' && (
        <ExhibitionPage
          initialModelId={selectedCharacter.id}
          onSelect={(modelId) => {
            handleModelSelect(modelId);
            setViewMode('chat');
          }}
          onCancel={() => setViewMode('chat')}
        />
      )}

      {/* --- Link SidePanel (Left) --- */}
      <aside className="h-full z-10">
        <SidePanel
          selectedCharacter={selectedCharacter}
          onModelSelect={handleModelSelect}
          animationUrl={animationUrl}
          onAnimationSelect={handleAnimationSelect}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          cameraMode={cameraMode}
          onCameraModeChange={setCameraMode}
          vrmFile={vrmFile}
          customVrmThumbnail={vrmThumbnail}
          thumbnailCache={thumbnailCache}
          onVrmUpload={handleVRMUpload}
          animationFile={animationFile}
          onAnimationUpload={handleAnimationUpload}
          isChatProcessing={isChatProcessing}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenExhibition={() => setViewMode('exhibition')}
        />
      </aside>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={aiConfig}
        onSave={setAiConfig}
      />

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
            cameraMode={cameraMode}
            onThumbnailGenerated={handleThumbnailGenerated}
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

        {/* View Mode Toggle (Floating) */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => setViewMode('exhibition')}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/40 border border-white/10 text-xs font-mono uppercase text-muted-foreground hover:text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm group"
          >
            <LayoutGrid className="size-4 group-hover:text-primary transition-colors" />
            <span>Exhibition Mode</span>
          </button>
        </div>
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
