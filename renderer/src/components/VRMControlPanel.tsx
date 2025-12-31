import * as React from "react";
import { Mic, User, Box, Monitor, Cpu, Activity, Settings, Save, Play, Pause, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "./ui/sheet";
import ThreeStage from "./ThreeStage";
import type { ThreeStageHandle } from "./ThreeStage";
import { AVAILABLE_MODELS } from "../lib/models";
import { AVAILABLE_ANIMATIONS } from "../lib/animations";
import { cn } from "../lib/utils";
import { Carousel3D } from "./ui/Carousel3D";
import { ChatOverlay } from "./ChatOverlay";
import type { ChatMessage } from "./ChatOverlay";
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
  const [animationSpeed] = React.useState([0.4]);
  const [lightIntensity] = React.useState([1]);
  const [cameraFov] = React.useState([50]);
  const [gridVisible] = React.useState(true);
  const [shadowsEnabled] = React.useState(true);
  const [backgroundColor] = React.useState("#050510"); // Deep Cyber Dark

  // Chat State
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("athena-chat-history");
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', content: 'Greetings. I am Athena. How can I assist you today?' }
    ];
  });
  const [isChatProcessing, setIsChatProcessing] = React.useState(false);

  // Persistence Effect
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
      const responseText = await sendMessageToOllama(text, selectedCharacter.systemPrompt); // Use character Prompt

      const aiMsg: ChatMessage = { role: 'assistant', content: responseText };
      setChatMessages(prev => [...prev, aiMsg]);

      // 4. Generate Speech
      // Switch to relaxed/idle before talking, or keep thinking? 
      // Usually better to go to neutral/idle for talking so hands don't block face
      stageRef.current?.playAnimationAction(AnimationAction.RELAX);

      const audioBlob = await generateSpeech(responseText, selectedCharacter.voiceStyle); // Use character Voice

      // 5. Play Audio (which drives lip sync)
      stageRef.current?.playAudio(audioBlob);

    } catch (error) {
      console.error("Chat Error:", error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: "[SYSTEM ERROR: Connection Lost]" }]);
      stageRef.current?.playAnimationAction(AnimationAction.SAD); // Error state
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
    <div className="h-screen w-full relative overflow-hidden bg-black text-cyan-50 font-sans selection:bg-cyan-500/30">

      {/* --- Main 3D Stage --- */}
      <main className="h-full w-full relative z-0">
        {/* Cyber Grid Background Overlay (Optional CSS effect can go here) */}
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
          <div className="flex h-full flex-col items-center justify-center bg-background relative overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5 pointer-events-none"></div>
            <div className="absolute top-1/4 left-1/4 size-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 size-96 bg-secondary/10 rounded-full blur-[100px] animate-pulse-slow strategy-alternate"></div>

            <div className="relative z-10 p-10 glass rounded-3xl flex flex-col items-center border-white/10">
              <Box className="size-20 text-primary animate-float drop-shadow-[0_0_15px_rgba(var(--primary),0.6)]" />
              <h2 className="mt-6 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary tracking-tight">System Standby</h2>
              <p className="mt-2 text-muted-foreground font-light tracking-wide">Select a VRM Module to Initialize</p>

              <div className="mt-8 flex gap-3">
                <div className="size-2 bg-primary rounded-full animate-bounce delay-75"></div>
                <div className="size-2 bg-secondary rounded-full animate-bounce delay-150"></div>
                <div className="size-2 bg-accent rounded-full animate-bounce delay-300"></div>
              </div>
            </div>
          </div>
        )}

        {/* --- Chat Overlay --- */}
        <ChatOverlay
          messages={chatMessages}
          onSendMessage={handleChatSubmit}
          onClearHistory={handleClearHistory}
          isProcessing={isChatProcessing}
        />

      </main>

      {/* --- Left Control Panel Trigger --- */}
      <div className="fixed top-12 left-0 z-50">
        <Sheet modal={false}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="
                h-14 w-10 rounded-r-2xl rounded-l-none border-l-0 
                glass hover:w-12 transition-all duration-300
                group border-white/10
                shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)]
              "
            >
              <div className="flex flex-col gap-1.5 items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-primary/60"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-primary/30"></div>
              </div>
              <span className="sr-only">Open Controls</span>
            </Button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="
              min-w-[400px] sm:w-[450px] p-0 border-r border-white/10 
              glass-panel
              text-foreground
              z-[60]
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary via-primary/50 to-transparent rounded-lg text-black">
                  <Monitor className="size-5" />
                </div>
                <span className="font-sans text-xl font-bold tracking-tight text-foreground">
                  Control<span className="text-secondary font-light">Panel</span>
                </span>
              </div>
              <SheetClose className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </SheetClose>
            </div>

            <Tabs defaultValue="main" className="h-full flex flex-col">
              <div className="px-4 pt-4 shrink-0">
                <TabsList className="w-full grid grid-cols-2 bg-cyan-950/30 border border-cyan-900/50 p-1 rounded-lg">
                  <TabsTrigger
                    value="main"
                    className="
                      data-[state=active]:bg-cyan-500/20 
                      data-[state=active]:text-cyan-300 
                      data-[state=active]:border-cyan-500/50
                      data-[state=active]:border
                      text-cyan-700 font-mono text-xs uppercase tracking-wider
                      rounded-md transition-all
                    "
                  >
                    Main
                  </TabsTrigger>
                  <TabsTrigger
                    value="system"
                    className="
                      data-[state=active]:bg-cyan-500/20 
                      data-[state=active]:text-cyan-300
                      data-[state=active]:border-cyan-500/50
                      data-[state=active]:border
                      text-cyan-700 font-mono text-xs uppercase tracking-wider
                      rounded-md transition-all
                    "
                  >
                    System
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* === MAIN TAB === */}
              <TabsContent value="main" className="flex-1 overflow-hidden flex flex-col mt-2 data-[state=active]:flex pb-4">
                <ScrollArea className="flex-1 w-full h-full">
                  <div className="p-4 space-y-6 pb-20">

                    {/* Status Display (Mini) */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono p-2 rounded border border-cyan-900/30 bg-cyan-950/10">
                      <div className="flex justify-between text-cyan-600">
                        <span>STATUS</span>
                        <span className="text-green-400">ONLINE</span>
                      </div>
                      <div className="flex justify-between text-cyan-600">
                        <span>FPS</span>
                        <span className="text-cyan-300">60</span>
                      </div>
                    </div>

                    {/* Speech Module (Original) */}
                    <section className="space-y-3 opacity-50 hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-mono uppercase tracking-widest text-cyan-600 flex items-center gap-2">
                          <Mic className="size-3" /> Manual Override
                        </Label>
                      </div>

                      <div className="relative group">
                        <div className="relative bg-black rounded-lg border border-cyan-900/50 p-1">
                          <Textarea
                            placeholder="Manual TTS injection..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="min-h-[40px] bg-transparent border-none text-xs font-mono text-cyan-100 placeholder:text-cyan-900/50 focus-visible:ring-0 resize-none"
                          />
                          <div className="flex justify-end p-1 border-t border-cyan-950">
                            <Button
                              size="sm"
                              onClick={handleSpeak}
                              disabled={!inputText.trim()}
                              className="h-6 text-[10px] bg-cyan-900/30 text-cyan-400 hover:bg-cyan-500 hover:text-black border border-cyan-800/50 hover:border-cyan-400 transition-all uppercase tracking-wider"
                            >
                              Speak
                            </Button>
                          </div>
                        </div>
                      </div>
                    </section>

                    <Separator className="bg-cyan-900/30" />

                    {/* Models Module - 3D Carousel */}
                    <section className="space-y-4 py-4 overflow-visible">
                      <Label className="text-[10px] font-mono uppercase tracking-widest text-cyan-600 flex items-center gap-2 justify-center">
                        <User className="size-3" /> Avatar Core System
                      </Label>

                      <div className="h-48 w-full">
                        <Carousel3D
                          items={AVAILABLE_MODELS.map(m => ({ id: m.id, label: m.name, description: m.description }))}
                          selectedId={selectedCharacter.id}
                          onSelect={handleModelSelect}
                          type="model"
                        />
                      </div>
                    </section>

                    <Separator className="bg-cyan-900/30" />

                    {/* Animations Module - 3D Carousel */}
                    <section className="space-y-4 py-4 overflow-visible">
                      <div className="flex items-center justify-between px-2">
                        <Label className="text-[10px] font-mono uppercase tracking-widest text-cyan-600 flex items-center gap-2">
                          <Activity className="size-3" /> Motion Protocols
                        </Label>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-cyan-600 hover:text-cyan-300 border border-cyan-900/30 hover:bg-cyan-950/50"
                          onClick={togglePlay}
                        >
                          {isPlaying ? <Pause className="size-3" /> : <Play className="size-3" />}
                        </Button>
                      </div>

                      <div className="h-48 w-full">
                        <Carousel3D
                          items={AVAILABLE_ANIMATIONS.map(a => ({ id: a, label: a.replace(".vrma", "").replace(".fbx", "") }))}
                          selectedId={animationUrl.split('/').pop() || ""}
                          onSelect={handleAnimationSelect}
                          type="animation"
                        />
                      </div>
                    </section>

                  </div>
                </ScrollArea>
              </TabsContent>

              {/* === SYSTEM TAB === */}
              <TabsContent value="system" className="flex-1 overflow-hidden flex flex-col mt-2 data-[state=active]:flex pb-4">
                <ScrollArea className="flex-1 w-full h-full">
                  <div className="p-4 space-y-6 pb-20">

                    {/* Camera Controls */}
                    <section className="space-y-3">
                      <Label className="text-[10px] font-mono uppercase tracking-widest text-cyan-600 flex items-center gap-2">
                        <Settings className="size-3" /> Optical Sensors
                      </Label>
                      <div className="grid grid-cols-3 gap-1">
                        {['face', 'half', 'full'].map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setCameraMode(mode)}
                            className={cn(
                              "px-2 py-1.5 rounded border text-[10px] font-mono uppercase transition-all",
                              cameraMode === mode
                                ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_10px_-4px_var(--color-cyan-500)]"
                                : "bg-transparent border-cyan-900/30 text-cyan-700 hover:border-cyan-700"
                            )}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </section>

                    <Separator className="bg-cyan-900/30" />

                    {/* File I/O */}
                    <section className="space-y-4">
                      <Label className="text-[10px] font-mono uppercase tracking-widest text-cyan-600 flex items-center gap-2">
                        <Save className="size-3" /> Data Ingestion
                      </Label>

                      <div className="space-y-2">
                        <Label className="text-[9px] text-cyan-800 uppercase">Custom VRM</Label>
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept=".vrm"
                            onChange={handleVRMUpload}
                            className="h-8 text-[10px] file:text-[10px] bg-black border-cyan-900/50 text-cyan-600 file:bg-cyan-950 file:text-cyan-400 file:border-0"
                          />
                        </div>
                        {vrmFile && <p className="text-[9px] text-cyan-500 font-mono truncate ps-1">Loaded: {vrmFile.name}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[9px] text-cyan-800 uppercase">Custom Motion</Label>
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept=".vrma,.fbx,.bvh,.glb"
                            onChange={handleAnimationUpload}
                            className="h-8 text-[10px] file:text-[10px] bg-black border-cyan-900/50 text-cyan-600 file:bg-cyan-950 file:text-cyan-400 file:border-0"
                          />
                        </div>
                        {animationFile && <p className="text-[9px] text-cyan-500 font-mono truncate ps-1">Loaded: {animationFile.name}</p>}
                      </div>
                    </section>

                    <Separator className="bg-cyan-900/30" />

                    {/* Debug Info */}
                    <section className="p-3 rounded bg-black border border-dashed border-cyan-900/50 space-y-2">
                      <div className="flex items-center gap-2 text-cyan-700 text-[10px] font-mono uppercase">
                        <Cpu className="size-3" /> System Diagnostics
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-cyan-900">
                          <span>LLM_BRIDGE</span>
                          <span className={isChatProcessing ? "text-yellow-500 animate-pulse" : "text-green-500"}>
                            {isChatProcessing ? "PROCESSING" : "STANDBY"}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-cyan-900">
                          <span>TTS_ENGINE</span>
                          <span className="text-green-500">READY</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-cyan-900">
                          <span>VRM_RENDERER</span>
                          <span className="text-cyan-500">WEBGL2</span>
                        </div>
                      </div>
                    </section>

                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </SheetContent>
        </Sheet>
      </div>

    </div>
  );
}

export default VRMControlPanel;
