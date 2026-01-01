import * as React from "react";
import { User, Activity, Settings, Save, Play, Pause, Monitor } from "lucide-react";
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
    isChatProcessing: boolean;
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

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

                {/* Status Bar - Minimal */}
                <div className="flex items-center justify-between px-2 py-1.5 bg-black/20 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-accent animate-pulse" />
                        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">System Online</span>
                    </div>
                    <span className="text-[9px] font-mono text-primary/70">WEBGL</span>
                </div>

                {/* Avatar Core */}
                <div className="space-y-2">
                    <Label className="section-label justify-center text-[9px] mb-1">
                        <User className="size-3 mr-1" /> Avatar
                    </Label>
                    <div className="h-32 w-full -mx-1">
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
                                if (id === 'custom') {
                                    // Already selected via upload, arguably no-op or re-trigger
                                } else {
                                    onModelSelect(id);
                                }
                            }}
                            type="model"
                        />
                    </div>
                </div>

                <Separator className="bg-white/5" />

                {/* Motion */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <Label className="section-label mb-0 text-[9px]">
                            <Activity className="size-3 mr-1" /> Motion
                        </Label>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-6 text-primary hover:text-white border border-white/10 hover:bg-white/10 rounded-full"
                            onClick={onTogglePlay}
                        >
                            {isPlaying ? <Pause className="size-3 fill-current" /> : <Play className="size-3 fill-current" />}
                        </Button>
                    </div>
                    <div className="h-28 w-full -mx-1">
                        <Carousel3D
                            items={AVAILABLE_ANIMATIONS.map(a => ({ id: a, label: a.replace(".vrma", "").replace(".fbx", "") }))}
                            selectedId={animationUrl.split('/').pop() || ""}
                            onSelect={onAnimationSelect}
                            type="animation"
                        />
                    </div>
                </div>

                <Separator className="bg-white/5" />

                {/* Optical Sensors (Camera) */}
                <div className="space-y-2">
                    <Label className="section-label text-[9px] mb-1">
                        <Settings className="size-3 mr-1" /> Camera
                    </Label>
                    <div className="grid grid-cols-3 gap-1">
                        {['face', 'half', 'full'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => onCameraModeChange(mode)}
                                className={cn(
                                    "px-1 py-1.5 rounded-md border text-[9px] font-mono uppercase transition-all",
                                    cameraMode === mode
                                        ? "bg-primary/20 border-primary text-primary"
                                        : "bg-transparent border-white/5 text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                                )}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2 mt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-[9px] h-6 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        onClick={() => {
                            localStorage.removeItem("athena-thumbnail-cache");
                            window.location.reload();
                        }}
                    >
                        Reset UI Cache
                    </Button>
                </div>

                <Separator className="bg-white/5" />

                {/* Data Ingestion - Compact */}
                {/* Data Ingestion - Upload Cards */}
                <div className="space-y-2">
                    <Label className="section-label text-[9px] mb-2">
                        <Save className="size-3 mr-1" /> Import Assets
                    </Label>

                    <div className="grid grid-cols-2 gap-3">
                        {/* VRM Upload Card */}
                        <div className="relative group aspect-square rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                            <Input
                                type="file"
                                accept=".vrm"
                                onChange={onVrmUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                            />

                            <div className="relative z-10 flex flex-col items-center justify-center p-2 text-center space-y-2 pointer-events-none transition-transform group-hover:scale-105">
                                <div className={cn(
                                    "p-3 rounded-full transition-colors backdrop-blur-sm shadow-xl",
                                    vrmFile ? "bg-primary/80 text-black border border-primary" : "bg-white/5 text-muted-foreground group-hover:text-primary border border-white/10"
                                )}>
                                    <User className="size-6" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-foreground drop-shadow-md">
                                        {vrmFile ? "VRM Loaded" : "Upload VRM"}
                                    </p>
                                    <p className="text-[8px] text-muted-foreground font-mono truncate max-w-[80px] drop-shadow-md">
                                        {vrmFile ? vrmFile.name : ".VRM Models"}
                                    </p>
                                </div>
                            </div>
                            {/* Glow effect on hover */}
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>

                        {/* Motion Upload Card */}
                        <div className="relative group aspect-square rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-secondary/50 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                            <Input
                                type="file"
                                accept=".vrma,.fbx,.bvh,.glb"
                                onChange={onAnimationUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                            />
                            <div className="flex flex-col items-center justify-center p-2 text-center space-y-2 pointer-events-none transition-transform group-hover:scale-105">
                                <div className={cn(
                                    "p-3 rounded-full transition-colors",
                                    animationFile ? "bg-secondary/20 text-secondary" : "bg-white/5 text-muted-foreground group-hover:text-secondary"
                                )}>
                                    <Activity className="size-6" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                                        {animationFile ? "Anim Ready" : "Add Motion"}
                                    </p>
                                    <p className="text-[8px] text-muted-foreground font-mono truncate max-w-[80px]">
                                        {animationFile ? animationFile.name : ".VRMA .FBX"}
                                    </p>
                                </div>
                            </div>
                            {/* Glow effect on hover */}
                            <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-4">
                    <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground/60">
                            <span>LLM</span>
                            <span className={isChatProcessing ? "text-accent animate-pulse" : "text-primary/50"}>
                                {isChatProcessing ? "BUSY" : "IDLE"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
