import * as React from "react";
import { Mic, User, Activity, Settings, Save, Play, Pause, Cpu, Monitor } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { cn } from "../lib/utils";
import { Carousel3D } from "./ui/Carousel3D";
import { AVAILABLE_MODELS } from "../lib/models";
import { AVAILABLE_ANIMATIONS } from "../lib/animations";
import type { CharacterProfile } from "../lib/models";

interface SidePanelProps {
    selectedCharacter: CharacterProfile;
    onModelSelect: (id: string) => void;
    animationUrl: string;
    onAnimationSelect: (filename: string) => void;
    isPlaying: boolean;
    onTogglePlay: () => void;
    inputText: string;
    setInputText: (val: string) => void;
    onSpeak: () => void;
    cameraMode: string;
    onCameraModeChange: (mode: string) => void;
    vrmFile: File | null;
    onVrmUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    animationFile: File | null;
    onAnimationUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isChatProcessing: boolean;
}

export function SidePanel({
    selectedCharacter,
    onModelSelect,
    animationUrl,
    onAnimationSelect,
    isPlaying,
    onTogglePlay,
    inputText,
    setInputText,
    onSpeak,
    cameraMode,
    onCameraModeChange,
    vrmFile,
    onVrmUpload,
    animationFile,
    onAnimationUpload,
    isChatProcessing
}: SidePanelProps) {
    return (
        <div className="panel-glass border-r">
            {/* Header */}
            <div className="panel-header">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary via-primary/50 to-transparent rounded-lg text-black">
                        <Monitor className="size-5" />
                    </div>
                    <span className="font-sans text-xl font-bold tracking-tight text-foreground">
                        Control<span className="text-secondary font-light">Panel</span>
                    </span>
                </div>
            </div>

            <Tabs defaultValue="main" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 pt-4 shrink-0">
                    <TabsList className="w-full grid grid-cols-2 bg-black/20 border border-white/5 p-1 rounded-xl">
                        <TabsTrigger
                            value="main"
                            className="
                      data-[state=active]:bg-primary/20 
                      data-[state=active]:text-primary 
                      data-[state=active]:border-primary/50
                      data-[state=active]:border
                      text-muted-foreground font-mono text-xs uppercase tracking-wider
                      rounded-lg transition-all
                    "
                        >
                            Main
                        </TabsTrigger>
                        <TabsTrigger
                            value="system"
                            className="
                      data-[state=active]:bg-primary/20 
                      data-[state=active]:text-primary
                      data-[state=active]:border-primary/50
                      data-[state=active]:border
                      text-muted-foreground font-mono text-xs uppercase tracking-wider
                      rounded-lg transition-all
                    "
                        >
                            System
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* === MAIN TAB === */}
                <TabsContent value="main" className="panel-content data-[state=active]:flex flex-col">

                    {/* Status Display */}
                    <div className="grid grid-cols-2 gap-3 mb-2">
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-1">
                            <span className="text-[10px] text-muted-foreground font-mono uppercase">Status</span>
                            <span className="text-xs font-bold text-accent">ONLINE</span>
                        </div>
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-1">
                            <span className="text-[10px] text-muted-foreground font-mono uppercase">Engine</span>
                            <span className="text-xs font-bold text-primary">WEBGL</span>
                        </div>
                    </div>

                    {/* Speech Module */}
                    <div className="panel-section">
                        <Label className="section-label">
                            <Mic className="size-3" /> Manual Override
                        </Label>

                        <div className="relative group p-1 bg-black/20 rounded-xl border border-white/5 transition-colors hover:border-white/10">
                            <Textarea
                                placeholder="TTS injection..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                className="min-h-[60px] bg-transparent border-none text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-0 resize-none"
                            />
                            <div className="flex justify-end p-2 border-t border-white/5">
                                <Button
                                    size="sm"
                                    onClick={onSpeak}
                                    disabled={!inputText.trim()}
                                    className="h-7 text-[10px] btn-primary-glass uppercase tracking-wider px-4"
                                >
                                    Speak
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Models Module */}
                    <div className="panel-section overflow-visible">
                        <Label className="section-label justify-center">
                            <User className="size-3" /> Avatar Core
                        </Label>
                        <div className="h-40 w-full">
                            <Carousel3D
                                items={AVAILABLE_MODELS.map(m => ({ id: m.id, label: m.name, description: m.description }))}
                                selectedId={selectedCharacter.id}
                                onSelect={onModelSelect}
                                type="model"
                            />
                        </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Animations Module */}
                    <div className="panel-section overflow-visible">
                        <div className="flex items-center justify-between px-1 mb-2">
                            <Label className="section-label mb-0">
                                <Activity className="size-3" /> Motion
                            </Label>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-primary hover:text-white border border-white/10 hover:bg-white/10 rounded-full"
                                onClick={onTogglePlay}
                            >
                                {isPlaying ? <Pause className="size-3 fill-current" /> : <Play className="size-3 fill-current" />}
                            </Button>
                        </div>
                        <div className="h-40 w-full">
                            <Carousel3D
                                items={AVAILABLE_ANIMATIONS.map(a => ({ id: a, label: a.replace(".vrma", "").replace(".fbx", "") }))}
                                selectedId={animationUrl.split('/').pop() || ""}
                                onSelect={onAnimationSelect}
                                type="animation"
                            />
                        </div>
                    </div>

                </TabsContent>

                {/* === SYSTEM TAB === */}
                <TabsContent value="system" className="panel-content data-[state=active]:flex flex-col">

                    {/* Camera Controls */}
                    <div className="panel-section">
                        <Label className="section-label">
                            <Settings className="size-3" /> Optical Sensors
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                            {['face', 'half', 'full'].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => onCameraModeChange(mode)}
                                    className={cn(
                                        "px-3 py-2 rounded-lg border text-[10px] font-mono uppercase transition-all",
                                        cameraMode === mode
                                            ? "bg-primary/20 border-primary text-primary shadow-[0_0_10px_-4px_var(--color-primary)]"
                                            : "bg-transparent border-white/10 text-muted-foreground hover:border-white/30 hover:text-foreground"
                                    )}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* File I/O */}
                    <div className="panel-section">
                        <Label className="section-label">
                            <Save className="size-3" /> Data Ingestion
                        </Label>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-[9px] text-muted-foreground uppercase pl-1">Custom VRM</Label>
                                <Input
                                    type="file"
                                    accept=".vrm"
                                    onChange={onVrmUpload}
                                    className="h-9 text-[10px] file:text-[10px] file:h-full bg-black/20 border-white/10 text-foreground file:bg-white/10 file:text-primary file:border-0 hover:file:bg-white/20 transition-all rounded-lg"
                                />
                                {vrmFile && <p className="text-[9px] text-primary font-mono truncate pl-1">Loaded: {vrmFile.name}</p>}
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[9px] text-muted-foreground uppercase pl-1">Custom Motion</Label>
                                <Input
                                    type="file"
                                    accept=".vrma,.fbx,.bvh,.glb"
                                    onChange={onAnimationUpload}
                                    className="h-9 text-[10px] file:text-[10px] file:h-full bg-black/20 border-white/10 text-foreground file:bg-white/10 file:text-primary file:border-0 hover:file:bg-white/20 transition-all rounded-lg"
                                />
                                {animationFile && <p className="text-[9px] text-primary font-mono truncate pl-1">Loaded: {animationFile.name}</p>}
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Debug Info */}
                    <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-3">
                        <div className="flex items-center gap-2 text-primary text-[10px] font-mono uppercase">
                            <Cpu className="size-3" /> Diagnostics
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                                <span>LLM_BRIDGE</span>
                                <span className={isChatProcessing ? "text-accent animate-pulse" : "text-primary"}>
                                    {isChatProcessing ? "PROCESSING" : "STANDBY"}
                                </span>
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                                <span>TTS_ENGINE</span>
                                <span className="text-secondary">READY</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                                <span>RENDERER</span>
                                <span className="text-primary">WEBGL2</span>
                            </div>
                        </div>
                    </div>

                </TabsContent>
            </Tabs>
        </div>
    );
}
