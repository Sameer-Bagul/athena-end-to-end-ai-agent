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
  const [vrmFile, setVrmFile] = React.useState<File | null>(null);
  const [vrmUrl, setVrmUrl] = React.useState<string>("models/athena.vrm");
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
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([
    { role: 'assistant', content: 'Greetings. I am Athena. How can I assist you today?' }
  ]);
  const [isChatProcessing, setIsChatProcessing] = React.useState(false);

  // Refs
  const stageRef = React.useRef<ThreeStageHandle>(null);

  // --- Handlers ---
  const handleSpeak = () => {
    if (inputText.trim()) {
      setSpeechText(inputText);
    }
  };

  const handleModelSelect = (filename: string) => {
    setVrmFile(null);
    setVrmUrl(`models/${filename}`);
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
      const responseText = await sendMessageToOllama(text);

      const aiMsg: ChatMessage = { role: 'assistant', content: responseText };
      setChatMessages(prev => [...prev, aiMsg]);

      // 4. Generate Speech
      // Switch to relaxed/idle before talking, or keep thinking? 
      // Usually better to go to neutral/idle for talking so hands don't block face
      stageRef.current?.playAnimationAction(AnimationAction.RELAX);

      const audioBlob = await generateSpeech(responseText);

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
          <div className="flex h-full flex-col items-center justify-center bg-[#050510]">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-[80px] opacity-20 rounded-full animate-pulse"></div>
              <Box className="relative z-10 size-24 text-cyan-600/50 animate-bounce-slow" />
            </div>
            <p className="mt-6 text-xl font-mono text-cyan-400 tracking-widest uppercase">System Standby</p>
            <p className="text-sm text-cyan-700 font-mono">Load VRM Module to Initialize</p>
          </div>
        )}

        {/* --- Chat Overlay --- */}
        <ChatOverlay
          messages={chatMessages}
          onSendMessage={handleChatSubmit}
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
                h-12 w-8 rounded-r-xl rounded-l-none border-l-0 
                bg-black/80 backdrop-blur-md 
                border-cyan-500/50 hover:bg-cyan-950/50 
                hover:border-cyan-400 hover:w-10 transition-all duration-300
                group shadow-[0_0_15px_-5px_var(--color-cyan-500)]
              "
            >
              <div className="flex flex-col gap-1 items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse group-hover:bg-cyan-300"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500/50 group-hover:bg-cyan-300/80"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500/20 group-hover:bg-cyan-300/50"></div>
              </div>
              <span className="sr-only">Open Controls</span>
            </Button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="
              min-w-[400px] sm:w-[450px] p-0 border-r border-cyan-500/30 
              bg-black/95 backdrop-blur-xl 
              shadow-[0_0_50px_-20px_var(--color-cyan-500)]
              text-cyan-50
              z-[60]
            "
          >
            {/* Decorative Header Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-cyan-900/50 bg-black/50">
              <div className="flex items-center gap-2">
                <Monitor className="size-5 text-cyan-400" />
                <span className="font-mono text-sm font-bold tracking-widest text-cyan-100">
                  SYS.<span className="text-cyan-500">CONTROL</span>
                </span>
              </div>
              {/* Close is handled by Sheet primitive usually, but we can add a custom minimalist one if needed */}
              <SheetClose className="text-cyan-700 hover:text-cyan-400 transition-colors">
                <X className="size-4" />
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
                          items={AVAILABLE_MODELS.map(m => ({ id: m, label: m.replace(".vrm", "") }))}
                          selectedId={vrmUrl.split('/').pop() || ""}
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
