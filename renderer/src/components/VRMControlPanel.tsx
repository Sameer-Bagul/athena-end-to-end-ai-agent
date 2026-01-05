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
import { SpeechRecognitionManager } from "../lib/SpeechRecognition";

// Extend Window interface for our preload API


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
  const [isListening, setIsListening] = React.useState(false);
  const [voiceStatus, setVoiceStatus] = React.useState<string>("idle");
  const [currentTranscript, setCurrentTranscript] = React.useState("");

  // Three.js Config
  const [animationSpeed] = React.useState([0.4]);
  const [lightIntensity] = React.useState([1]);
  const [cameraFov] = React.useState([50]);
  const [gridVisible] = React.useState(true);
  const [shadowsEnabled] = React.useState(true);
  const [backgroundColor] = React.useState("#050510");

  // Chat State
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([
    { role: 'assistant', content: 'Initializing...' }
  ]);
  const [isChatProcessing, setIsChatProcessing] = React.useState(false);

  const [viewMode, setViewMode] = React.useState<'chat' | 'exhibition'>('chat');

  // Load History on Mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        if (window.athena?.loadHistory) {
          const history = await window.athena.loadHistory();
          if (history && Array.isArray(history) && history.length > 0) {
            setChatMessages(history);
          } else {
            // Default welcome message if history is empty
            setChatMessages([
              { role: 'assistant', content: 'Greetings. I am Athena. How can I assist you today?' }
            ]);
          }
        } else {
          console.warn("Athena API not available, falling back to default.");
          setChatMessages([
            { role: 'assistant', content: 'Greetings. I am Athena. How can I assist you today?' }
          ]);
        }
      } catch (e) {
        console.error("Failed to load history", e);
        setChatMessages([
          { role: 'assistant', content: 'Greetings. I am Athena. How can I assist you today?' }
        ]);
      }
    };
    loadData();
  }, []);

  // Save History on Change
  React.useEffect(() => {
    const save = async () => {
      if (chatMessages.length > 0 && window.athena?.saveHistory) {
        console.log("Saving chat history...", chatMessages.length, "messages");
        const success = await window.athena.saveHistory(chatMessages);
        console.log("Chat history saved:", success);
      }
    };
    save();
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
  const speechManagerRef = React.useRef<SpeechRecognitionManager | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Initialize Speech Manager & Cleanup
  React.useEffect(() => {
    speechManagerRef.current = new SpeechRecognitionManager();
    return () => {
      if (speechManagerRef.current) speechManagerRef.current.stop();
      if (abortControllerRef.current) abortControllerRef.current.abort();
      setIsChatProcessing(false); // Ensure we don't lock UI on unmount
    }
  }, []);

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

  const handleInterrupt = () => {
    console.log("🛑 [Interrupt] User started speaking. Stopping AI.");
    if (stageRef.current) {
      stageRef.current.stopAudio();
    }
    // Cancel any ongoing LLM request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleSpeechResult = (text: string) => {
    console.log("🗣️ [Voice] User said:", text);
    console.log("🗣️ [Voice] Submitting to chat...");
    setCurrentTranscript("");
    // Treat as a new message
    handleChatSubmit(text); // Pass directly to existing submit handler
  };

  const handleInterimResult = (text: string) => {
    setCurrentTranscript(text);
  };

  const toggleListening = () => {
    if (!speechManagerRef.current) return;

    if (isListening) {
      console.log("🛑 [ControlPanel] Toggling OFF listening");
      // Stop without aborting
      speechManagerRef.current.stop(false);
      setIsListening(false);
      setCurrentTranscript("");
      setVoiceStatus("idle");
    } else {
      console.log("▶️ [ControlPanel] Toggling ON listening");
      speechManagerRef.current.start({
        onResult: handleSpeechResult,
        onSpeechStart: handleInterrupt,
        onInterimResult: handleInterimResult,
        onStatusChange: setVoiceStatus,
        onError: (err: any) => setVoiceStatus(`error: ${err}`)
      });
      setIsListening(true);
    }
  };

  // Audio Queue State
  const audioQueueRef = React.useRef<Blob[]>([]);
  const isPlayingAudioRef = React.useRef(false);

  // Helper to process queue
  const playNextInQueue = async () => {
    if (isPlayingAudioRef.current || audioQueueRef.current.length === 0) return;

    isPlayingAudioRef.current = true;
    const blob = audioQueueRef.current.shift(); // Dequeue

    if (blob && stageRef.current) {
      try {
        // This now returns a Promise thanks to our earlier change
        await stageRef.current.playAudio(blob);
      } catch (e) {
        console.error("Audio Playback Error:", e);
      }
    }

    isPlayingAudioRef.current = false;
    // Recursively check for next
    playNextInQueue();
  };

  const addToAudioQueue = (blob: Blob) => {
    audioQueueRef.current.push(blob);
    playNextInQueue();
  };

  const handleChatSubmit = async (text: string) => {
    if (!text.trim()) {
      console.warn("⚠️ [Chat] Empty text, ignoring submit");
      return;
    }
    console.log("📩 [Chat] Submitting message:", text);

    // Interrupt previous if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Reset Audio Queue
    audioQueueRef.current = [];
    isPlayingAudioRef.current = false;
    stageRef.current?.stopAudio();

    // 1. Add User Message
    const userMsg: ChatMessage = { role: 'user', content: text };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatProcessing(true);

    try {
      // 2. Trigger Thinking & Add Placeholder AI Message
      stageRef.current?.playAnimationAction(AnimationAction.THINKING);

      // Add empty assistant message for streaming
      setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      let streamBuffer = "";
      let sentenceBuffer = "";

      // Regex for sentence ending: punctuation followed by space or end of string
      // Note: We need to be careful not to split on "Mr." or "Dr." etc, but simple is okay for now.
      const sentenceRegex = /[.!?]+[\s\n]+/;

      // 3. Call LLM (Streaming)
      await sendMessageToOllama(
        text,
        selectedCharacter.systemPrompt,
        (token) => {
          streamBuffer += token;
          sentenceBuffer += token;

          // Check for complete sentence
          // We look for the regex match. If found, we split, take the first part as sentence, 
          // and keep the rest in buffer.
          const match = sentenceBuffer.match(sentenceRegex);
          if (match && match.index !== undefined) {
            const endIdx = match.index + match[0].length;
            const sentence = sentenceBuffer.substring(0, endIdx);
            const remaining = sentenceBuffer.substring(endIdx);

            // Trigger TTS for this sentence immediately
            if (sentence.trim().length > 1) { // Avoid tiny noise
              generateSpeech(sentence, selectedCharacter.voiceStyle)
                .then(blob => {
                  if (!controller.signal.aborted) {
                    addToAudioQueue(blob);
                    // If this is the first audio, switch animation to RELAX/Happy
                    stageRef.current?.playAnimationAction(AnimationAction.RELAX);
                  }
                })
                .catch(err => console.error("TTS Chunk Error:", err));
            }

            sentenceBuffer = remaining;
          }

          setChatMessages(prev => {
            const newHistory = [...prev];
            const lastIndex = newHistory.length - 1;
            if (lastIndex >= 0 && newHistory[lastIndex].role === 'assistant') {
              newHistory[lastIndex] = {
                ...newHistory[lastIndex],
                content: streamBuffer
              };
            }
            return newHistory;
          });
        },
        controller.signal
      );

      // 4. Process any remaining text in buffer (final sentence)
      if (sentenceBuffer.trim().length > 0 && !controller.signal.aborted) {
        try {
          const blob = await generateSpeech(sentenceBuffer, selectedCharacter.voiceStyle);
          if (!controller.signal.aborted) {
            addToAudioQueue(blob);
          }
        } catch (e) {
          console.error("Final TTS Chunk Error:", e);
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("✋ [Chat] Request aborted (Interruption)");
        setIsChatProcessing(false);
        return;
      }
      console.error("Chat Error:", error);
      setChatMessages(prev => {
        const newHistory = [...prev];
        const lastIndex = newHistory.length - 1;
        if (newHistory[lastIndex].role === 'assistant' && !newHistory[lastIndex].content) {
          newHistory[lastIndex].content = "[SYSTEM ERROR: Connection Lost]";
        } else {
          newHistory.push({ role: 'assistant', content: "[SYSTEM ERROR: Connection Lost]" });
        }
        return newHistory;
      });
      stageRef.current?.playAnimationAction(AnimationAction.SAD);
    } finally {
      // If this controller is still the active one OR if active one is null (cleaned up), reset processing.
      // But actually, we just want to ensure we don't turn off processing if a NEW request replaced us.
      // If abortControllerRef.current is NOT us, it means someone else took over or we were aborted.
      // If we were aborted, we likely want to stop processing anyway? 
      // The issue is if we crashed, abortControllerRef might still be us.

      const isStillActive = abortControllerRef.current === controller;
      if (isStillActive) {
        setIsChatProcessing(false);
        abortControllerRef.current = null;
      } else {
        // We were replaced or aborted. 
        // If replaced, new one sets isChatProcessing=true, so we do nothing.
      }

      // Safety Fallback: If we are here, we are done. 
      // If the user can't type, it's because isChatProcessing is TRUE.
      // If we are the active controller, we MUST set it false.
    }
  };

  const handleClearHistory = () => {
    const newHistory: ChatMessage[] = [{ role: 'assistant', content: 'History cleared. Ready for new input.' }];
    setChatMessages(newHistory);
    window.athena.saveHistory(newHistory);
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
          isListening={isListening}
          onToggleListening={toggleListening}
          voiceStatus={voiceStatus}
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
      <aside className="h-full z-10 overflow-hidden">
        <ChatPanel
          messages={chatMessages}
          onSendMessage={handleChatSubmit}
          onClearHistory={handleClearHistory}
          isProcessing={isChatProcessing}
          currentTranscript={currentTranscript}
        />
      </aside>

    </div>
  );
}

export default VRMControlPanel;
