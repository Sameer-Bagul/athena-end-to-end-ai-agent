import * as React from "react";
import { User, Activity, Play, Pause, Settings, LayoutGrid, Mic, MicOff } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";

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
    cameraMode: string;
    onCameraModeChange: (mode: string) => void;
    vrmFile: File | null;
    customVrmThumbnail: string | null;
    thumbnailCache: Record<string, string>;
    onVrmUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    animationFile: File | null;
    onAnimationUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    // isChatProcessing is removed from destructuring but kept in type for compat
    isChatProcessing: boolean;
    onOpenSettings: () => void;
    onOpenExhibition: () => void;
    isListening: boolean;
    onToggleListening: () => void;
    voiceStatus?: string;
    // Collapse Props
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export function SidePanel({
    selectedCharacter,
    onModelSelect,
    animationUrl,
    onAnimationSelect,
    isPlaying,
    onTogglePlay,
    cameraMode,
    onCameraModeChange,
    vrmFile,
    customVrmThumbnail,
    thumbnailCache,
    onVrmUpload,
    animationFile,
    onAnimationUpload,
    isChatProcessing,
    onOpenSettings,
    onOpenExhibition,
    isListening,
    onToggleListening,
    voiceStatus,
    isCollapsed = false,
    onToggleCollapse
}: SidePanelProps) {

    // Helper to suppress unused vars warning for now (or I should use them)
    // Actually, I am using animationFile and voiceStatus below in the expanded view?
    // Wait, the error says 'animationFile' is never read. In my previous edit I replaced the content.
    // Let me check if I accidentally removed the expanded view part where they were used.
    // Ah, I see "partially reduced minimal expanded view".
    // I simplified the "Import" section. I removed the "Save" icon usage.
    // I also simplified the Card content. 
    // Let me check if `animationFile` is used in the `animationFile ? "Ready" : "Motion"` logic.
    // It seems I kept it: `{animationFile ? "Ready" : "Motion"}` in my replacement.
    // Why did TS complain? Maybe I messed up the replacement block scope?
    // Let's re-read the file to be sure.

    // --- Minimalist / Collapsed View ---
    if (isCollapsed) {
        return (
            <div className="panel-glass border-r w-full flex flex-col items-center py-4 gap-6 bg-black/60 backdrop-blur-xl">
                {/* Collapse Toggle (Top) */}
                <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="size-8 text-muted-foreground hover:text-white">
                    <LayoutGrid className="size-4 rotate-90" />
                </Button>

                {/* Vertical Icon Menu */}
                <div className="flex flex-col gap-4 mt-2 w-full px-2">
                    {/* Model Indicator (Avatar) */}
                    <div className="relative group flex justify-center">
                        <div className="size-10 rounded-full overflow-hidden border border-white/10 group-hover:border-primary/50 transition-all cursor-pointer" onClick={onToggleCollapse}>
                            {thumbnailCache[selectedCharacter.id] ? (
                                <img src={thumbnailCache[selectedCharacter.id]} className="w-full h-full object-cover" />
                            ) : (
                                <User className="size-5 m-auto text-muted-foreground" />
                            )}
                        </div>
                    </div>

                    <Separator className="bg-white/5 w-8 mx-auto" />

                    {/* Play/Pause Minimal */}
                    <div className="flex justify-center">
                        <Button
                            size="icon" variant="ghost"
                            onClick={onTogglePlay}
                            className={cn("size-8 rounded-full", isPlaying ? "text-secondary bg-secondary/10" : "text-muted-foreground")}
                        >
                            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                        </Button>
                    </div>

                    {/* Voice Toggle Minimal */}
                    <div className="flex justify-center">
                        <Button
                            size="icon" variant="ghost"
                            onClick={onToggleListening}
                            className={cn("size-8 rounded-full", isListening ? "text-red-400 bg-red-400/10" : "text-muted-foreground")}
                        >
                            {isListening ? <Mic className="size-4 animate-pulse" /> : <MicOff className="size-4" />}
                        </Button>
                    </div>

                    <div className="mt-auto flex flex-col gap-4 items-center w-full">
                        <Button
                            size="icon" variant="ghost"
                            onClick={onOpenSettings}
                            className="size-8 text-muted-foreground hover:text-white"
                        >
                            <Settings className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Partially Reduced "Minimal" Expanded View ---
    return (
        <div className="panel-glass border-r">
            {/* Header with Collapse */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
                <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60">Controls</span>
                <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="size-6 text-muted-foreground hover:text-white">
                    <LayoutGrid className="size-3" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">

                {/* Status Bar - Removed "System Online" pill for minimalism, kept clear layout */}

                {/* Avatar Core */}
                <div className="space-y-3">
                    <Label className="section-label text-[9px] text-primary/60">
                        IDENTITY
                    </Label>
                    <div className="h-44 w-full -mx-1">
                        <Carousel3D
                            items={[
                                ...AVAILABLE_MODELS.map(m => ({
                                    id: m.id,
                                    label: m.name,
                                    description: m.description,
                                    image: thumbnailCache[m.id] || m.image
                                })),
                                ...(vrmFile ? [{
                                    id: 'custom',
                                    label: 'Custom',
                                    description: vrmFile.name,
                                    image: customVrmThumbnail || undefined,
                                    icon: <User />
                                }] : [])
                            ]}
                            selectedId={vrmFile ? 'custom' : selectedCharacter.id}
                            onSelect={(id) => {
                                if (id !== 'custom') onModelSelect(id);
                            }}
                            type="model"
                        />
                    </div>
                    {/* Exhibition Trigger - More subtle */}
                    <Button
                        variant="outline"
                        className="w-full h-8 text-[9px] border-white/5 bg-black/20 hover:bg-primary/20 hover:border-primary/30 transition-all uppercase tracking-widest text-muted-foreground hover:text-primary"
                        onClick={onOpenExhibition}
                    >
                        Display Mode
                    </Button>
                </div>

                {/* Motion */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="section-label text-[9px] text-secondary/60 mb-0">ANIMATION</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] font-mono text-muted-foreground/40">{isPlaying ? "PLAYING" : "PAUSED"}</span>
                            <Button
                                size="icon"
                                variant="ghost"
                                className={cn(
                                    "size-5 rounded-full border transition-all",
                                    isPlaying
                                        ? "bg-secondary text-black border-secondary"
                                        : "bg-transparent text-secondary border-secondary/30"
                                )}
                                onClick={onTogglePlay}
                            >
                                {isPlaying ? <Pause className="size-2.5 fill-current" /> : <Play className="size-2.5 fill-current ml-0.5" />}
                            </Button>
                        </div>
                    </div>
                    <div className="h-24 w-full -mx-1 opacity-90 hover:opacity-100 transition-opacity">
                        <Carousel3D
                            items={AVAILABLE_ANIMATIONS.map(a => ({ id: a, label: a.replace(".vrma", "").replace(".fbx", "") }))}
                            selectedId={animationUrl.split('/').pop() || ""}
                            onSelect={onAnimationSelect}
                            type="animation"
                        />
                    </div>
                </div>

                {/* Voice Uplink */}
                <div className="space-y-2">
                    <Label className="section-label text-[9px] text-blue-400/60">VOICE</Label>
                    <Button
                        variant="ghost"
                        disabled={isChatProcessing && !isListening}
                        className={cn(
                            "w-full h-9 border font-mono text-[9px] uppercase tracking-wider transition-all duration-300 rounded-lg",
                            isListening
                                ? "bg-red-500/10 text-red-300 border-red-500/20"
                                : "bg-black/20 text-muted-foreground border-white/5 hover:bg-white/5"
                        )}
                        onClick={onToggleListening}
                    >
                        {isListening ? (
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                                </span>
                                Microphone Active
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 opacity-60">
                                <MicOff className="size-3" />
                                Voice Unavailable
                            </div>
                        )}
                    </Button>
                    {voiceStatus && (
                        <div className={cn(
                            "text-[8px] font-mono text-center tracking-wider uppercase mt-1 truncate",
                            voiceStatus.includes('error') ? "text-red-500" : "text-muted-foreground/40"
                        )}>
                            {voiceStatus}
                        </div>
                    )}
                </div>


                {/* Data Ingestion - Compact Cards (Renamed/Simplified) */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                    {/* VRM Upload Card - Compact */}
                    <div className="relative group h-16 rounded-lg border border-white/5 bg-black/20 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-1">
                        <Input
                            type="file"
                            accept=".vrm"
                            onChange={onVrmUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <User className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        <span className="text-[8px] font-mono text-muted-foreground/40 uppercase group-hover:text-white transition-colors">Import VRM</span>
                    </div>

                    {/* Motion Upload Card - Compact */}
                    <div className="relative group h-16 rounded-lg border border-white/5 bg-black/20 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-1">
                        <Input
                            type="file"
                            accept=".vrma,.fbx,.bvh,.glb"
                            onChange={onAnimationUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <Activity className="size-4 text-muted-foreground/40 group-hover:text-secondary transition-colors" />
                        <span className="text-[8px] font-mono text-muted-foreground/40 uppercase group-hover:text-white transition-colors">Import Anim</span>
                    </div>
                </div>


                {/* Optical Sensors (Camera) - Segmented Control */}
                <div className="space-y-2 mt-1">
                    <div className="p-0.5 bg-black/40 rounded-lg border border-white/5 grid grid-cols-3 gap-0.5">
                        {[
                            { id: 'face', label: 'Face' },
                            { id: 'half', label: 'Body' },
                            { id: 'full', label: 'Wide' }
                        ].map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => onCameraModeChange(mode.id)}
                                className={cn(
                                    "py-1.5 rounded-md text-[9px] font-medium tracking-wide transition-all duration-300",
                                    cameraMode === mode.id
                                        ? "bg-white/10 text-white shadow-sm"
                                        : "text-muted-foreground/50 hover:text-white/80"
                                )}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>


                {/* Footer Settings */}
                <div className="mt-auto pt-2">
                    <Button
                        variant="ghost"
                        className="w-full h-8 text-muted-foreground hover:text-white justify-between px-2 text-[10px]"
                        onClick={onOpenSettings}
                    >
                        <span>Settings</span>
                        <Settings className="size-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
