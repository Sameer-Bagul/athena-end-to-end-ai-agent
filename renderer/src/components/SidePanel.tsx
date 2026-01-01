import * as React from "react";
import { User, Activity, Save, Play, Pause, Monitor, Settings, LayoutGrid } from "lucide-react";
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
    isChatProcessing?: boolean;
    onOpenSettings: () => void;
    onOpenExhibition: () => void;
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
    onOpenSettings,
    onOpenExhibition
}: SidePanelProps) {
    return (
        <div className="panel-glass border-r">
            {/* Header */}
            {/* <div className="panel-header">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary via-primary/50 to-transparent rounded-lg text-black">
                        <Monitor className="size-5" />
                    </div>
                    <span className="font-sans text-xl font-bold tracking-tight text-foreground">
                        Control<span className="text-secondary font-light">Panel</span>
                    </span>
                </div>
            </div> */}

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

                {/* Status Bar - Minimal Pill */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                        <div className="size-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        <span className="text-[9px] font-mono text-green-500/90 font-bold uppercase tracking-wider">System Online</span>
                    </div>
                    <div className="px-2 py-1 bg-white/5 rounded-md border border-white/5">
                        <span className="text-[8px] font-mono text-muted-foreground">V 1.0.0</span>
                    </div>
                </div>

                {/* Avatar Core */}
                <div className="space-y-3">
                    <Label className="section-label justify-center text-[10px] mb-2 text-primary/80">
                        <User className="size-3 mr-1.5" /> Identity Module
                    </Label>
                    {/* Increased Height for better visibility */}
                    <div className="h-48 w-full -mx-1">
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
                    {/* Exhibition Trigger */}
                    <Button
                        variant="ghost"
                        className="w-full mt-2 h-8 text-[10px] uppercase tracking-wider border border-primary/20 hover:bg-primary/10 hover:text-primary transition-all group"
                        onClick={onOpenExhibition}
                    >
                        <LayoutGrid className="size-3 mr-2 group-hover:scale-110 transition-transform" />
                        Enter Exhibition
                    </Button>
                </div>

                <Separator className="bg-white/5" />

                {/* Motion */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <Label className="section-label mb-0 text-[10px] text-secondary/80">
                            <Activity className="size-3 mr-1.5" /> Motion Protocol
                        </Label>
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                                "size-6 rounded-full border transition-all duration-300",
                                isPlaying
                                    ? "bg-secondary text-black border-secondary shadow-[0_0_10px_rgba(236,72,153,0.3)] hover:bg-secondary/90"
                                    : "bg-transparent text-secondary border-secondary/30 hover:bg-secondary/10"
                            )}
                            onClick={onTogglePlay}
                        >
                            {isPlaying ? <Pause className="size-3 fill-current" /> : <Play className="size-3 fill-current ml-0.5" />}
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

                {/* Optical Sensors (Camera) - Segmented Control */}
                <div className="space-y-2">
                    <Label className="section-label text-[10px] mb-2">
                        <Monitor className="size-3 mr-1.5" /> Optical Sensors
                    </Label>
                    <div className="p-1 bg-black/40 rounded-lg border border-white/5 grid grid-cols-3 gap-1">
                        {[
                            { id: 'face', label: 'FACE' },
                            { id: 'half', label: 'BODY' }, // Changed 'half' to 'BODY' for better UX
                            { id: 'full', label: 'WIDE' }  // Changed 'full' to 'WIDE'
                        ].map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => onCameraModeChange(mode.id)}
                                className={cn(
                                    "py-1.5 rounded-md text-[9px] font-bold tracking-wider transition-all duration-300 relative overflow-hidden",
                                    cameraMode === mode.id
                                        ? "bg-primary text-black shadow-lg"
                                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2 mt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-[9px] h-7 text-muted-foreground hover:text-red-400 hover:bg-red-500/5 transition-colors"
                        onClick={() => {
                            localStorage.removeItem("athena-thumbnail-cache");
                            window.location.reload();
                        }}
                    >
                        Reset Cache
                    </Button>
                </div>

                <Separator className="bg-white/5" />

                {/* Settings Trigger */}
                <div className="space-y-2">
                    <Button
                        variant="outline"
                        className="w-full h-9 border-white/5 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 hover:border-white/10 justify-start"
                        onClick={onOpenSettings}
                    >
                        <Settings className="size-3.5 mr-2" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Configure System</span>
                    </Button>
                </div>

                <Separator className="bg-white/5" />

                {/* Data Ingestion - Compact Cards */}
                <div className="space-y-2">
                    <Label className="section-label text-[10px] mb-2">
                        <Save className="size-3 mr-1.5" /> Import
                    </Label>

                    <div className="grid grid-cols-2 gap-2">
                        {/* VRM Upload Card - Compact */}
                        <div className="relative group h-20 rounded-lg border border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-1">
                            <Input
                                type="file"
                                accept=".vrm"
                                onChange={onVrmUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className={cn(
                                "size-8 rounded-full flex items-center justify-center transition-colors shadow-lg text-[10px]",
                                vrmFile ? "bg-primary text-black" : "bg-black/20 text-muted-foreground group-hover:text-primary"
                            )}>
                                <User className="size-4" />
                            </div>
                            <span className="text-[9px] font-medium text-muted-foreground/80 uppercase tracking-wide group-hover:text-white transition-colors">
                                {vrmFile ? "Loaded" : "VRM"}
                            </span>
                        </div>

                        {/* Motion Upload Card - Compact */}
                        <div className="relative group h-20 rounded-lg border border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-secondary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-1">
                            <Input
                                type="file"
                                accept=".vrma,.fbx,.bvh,.glb"
                                onChange={onAnimationUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className={cn(
                                "size-8 rounded-full flex items-center justify-center transition-colors shadow-lg text-[10px]",
                                animationFile ? "bg-secondary text-black" : "bg-black/20 text-muted-foreground group-hover:text-secondary"
                            )}>
                                <Activity className="size-4" />
                            </div>
                            <span className="text-[9px] font-medium text-muted-foreground/80 uppercase tracking-wide group-hover:text-white transition-colors">
                                {animationFile ? "Ready" : "Motion"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-2">
                    {/* Tiny Footer */}
                    <div className="flex items-center justify-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
                        <div className="size-1 bg-white rounded-full" />
                        <span className="text-[8px] uppercase tracking-[0.2em]">Athena OS</span>
                        <div className="size-1 bg-white rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
