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
import { useAppStore } from "../context/AppContext";

interface SidePanelProps {
    onToggleListening: () => void;
    // File uploads are simple enough to handle here if we dispatch actions
    onVrmUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAnimationUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onExpressionChange?: (name: string, value: number) => void;
}

export function SidePanel({ onToggleListening, onVrmUpload: _externalVrm, onAnimationUpload: _externalAnim, onExpressionChange }: SidePanelProps) {
    // Facial expressions to control (can be expanded)
    const FACIAL_EXPRESSIONS = [
        { name: "Smile", label: "Smile" },
        { name: "Joy", label: "Joy" },
        { name: "Angry", label: "Angry" },
        { name: "Sad", label: "Sad" },
        { name: "Surprised", label: "Surprised" },
        { name: "EyeSmileLeft", label: "Eye Smile L" },
        { name: "EyeSmileRight", label: "Eye Smile R" }
    ];

    // Local state for slider values
    const [expressionValues, setExpressionValues] = React.useState(() => Object.fromEntries(FACIAL_EXPRESSIONS.map(e => [e.name, 0])));

    // Update VRM blendshape in real time
    const handleExpressionChange = (name: string, value: number) => {
        setExpressionValues(v => ({ ...v, [name]: value }));
        if (onExpressionChange) {
            onExpressionChange(name, value);
        }
        console.log(`Set facial expression ${name} to ${value}`);
    };
    const { state, actions } = useAppStore();

    // Handlers for file inputs to bridge to Context Actions
    const handleVrmUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            actions.setVrmFile(e.target.files[0]);
        }
    };

    const handleAnimationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            actions.setAnimationFile(e.target.files[0]);
        }
    };

    // --- Minimalist / Collapsed View ---
    if (state.isLeftCollapsed) {
        return (
            <div className="h-full w-full flex flex-col items-center py-6 gap-8 relative">
                {/* Active Indicator Strip */}
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-primary/30 to-transparent" />

                {/* Collapse Toggle */}
                <Button variant="ghost" size="icon" onClick={actions.toggleLeftCollapse}
                    className="size-10 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300">
                    <LayoutGrid className="size-5" />
                </Button>

                {/* Vertical Icon Menu */}
                <div className="flex flex-col gap-6 w-full px-3 items-center">

                    {/* Model Indicator */}
                    <div className="relative group flex justify-center w-full">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
                        <div className="size-11 rounded-2xl overflow-hidden border border-white/5 group-hover:border-primary/50 transition-all cursor-pointer relative z-10 shadow-lg shadow-black/50"
                            onClick={actions.toggleLeftCollapse} title={state.selectedCharacter.name}>
                            {state.thumbnailCache[state.selectedCharacter.id] ? (
                                <img src={state.thumbnailCache[state.selectedCharacter.id]} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                            ) : (
                                <User className="size-5 m-auto text-white/40" />
                            )}
                        </div>
                    </div>

                    <Separator className="bg-white/10 w-8 mx-auto" />

                    {/* Play/Pause Minimal */}
                    <Button
                        size="icon" variant="ghost"
                        onClick={actions.togglePlay}
                        className={cn("size-10 rounded-xl relative z-10 transition-all border border-transparent hover:bg-white/5",
                            state.isPlaying ? "text-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.2)] border-primary/20" : "text-white/40 hover:text-white")}
                        title={state.isPlaying ? "Pause Animation" : "Play Animation"}
                    >
                        {state.isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current ml-0.5" />}
                    </Button>

                    {/* Voice Toggle Minimal */}
                    <Button
                        size="icon" variant="ghost"
                        onClick={onToggleListening}
                        className={cn("size-10 rounded-xl relative z-10 transition-all border border-transparent hover:bg-white/5",
                            state.isListening ? "text-red-400 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse-slow border-red-500/20" : "text-white/40 hover:text-white")}
                        title={state.isListening ? "Stop Microphone" : "Start Microphone"}
                    >
                        {state.isListening ? <Mic className="size-4" /> : <MicOff className="size-4" />}
                    </Button>

                    <div className="mt-auto flex flex-col gap-4 items-center w-full pt-4">
                        <Button
                            size="icon" variant="ghost"
                            onClick={() => actions.toggleSettings(true)}
                            className="size-10 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all hover:rotate-90 duration-500"
                            title="Settings"
                        >
                            <Settings className="size-5" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Expanded View ---
    return (
        <div className="h-full flex flex-col relative w-full font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/40">Controls</span>
                <Button variant="ghost" size="icon" onClick={actions.toggleLeftCollapse} className="size-8 text-white/40 hover:text-white hover:bg-white/5 rounded-lg -mr-2">
                    <LayoutGrid className="size-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
                {/* Moods */}
                <div className="space-y-3">
                    <Label className="text-[10px] font-medium tracking-[0.2em] text-yellow-400/60 uppercase pl-1">Moods</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            {
                                label: "Neutral",
                                value: "Neutral",
                                title: "Reset to default",
                                preset: {} // Just reset
                            },
                            {
                                label: "Happy",
                                value: "Joy",
                                title: "Joy (100%)",
                                preset: { Joy: 1.0 }
                            },
                            {
                                label: "Sad",
                                value: "Sad",
                                title: "Sorrow (100%)",
                                preset: { Sad: 1.0 }
                            },
                            {
                                label: "Angry",
                                value: "Angry",
                                title: "Angry (100%)",
                                preset: { Angry: 1.0 }
                            },
                            {
                                label: "Surprised",
                                value: "Surprised",
                                title: "Surprised (100%)",
                                preset: { Surprised: 1.0 }
                            },
                            {
                                label: "Relaxed",
                                value: "Fun",
                                title: "Fun (70%) + Subtle Blink",
                                preset: { Fun: 0.7, Blink: 0.1 }
                            }
                        ].map((mood) => (
                            <button
                                key={mood.label}
                                title={mood.title}
                                onClick={() => {
                                    // 1. Reset all emotions first
                                    const allKeys = ["Joy", "Sad", "Angry", "Surprised", "Relax", "Fun", "Neutral", "Smile", "Frown", "Blink", "EyeSmileLeft", "EyeSmileRight"];
                                    const resetState: any = {};
                                    allKeys.forEach(k => resetState[k] = 0);

                                    // Apply reset to manager
                                    allKeys.forEach(k => handleExpressionChange(k, 0));

                                    // 2. Apply Preset values
                                    Object.entries(mood.preset).forEach(([key, val]) => {
                                        handleExpressionChange(key, val as number);
                                        resetState[key] = val; // Update local state
                                    });

                                    // 3. Update Visual State
                                    setExpressionValues(resetState);
                                }}
                                className={cn(
                                    "py-2.5 rounded-xl text-[10px] font-medium tracking-wider uppercase transition-all duration-300 border",
                                    (expressionValues[mood.value] || 0) > 0.1
                                        ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                                        : "bg-white/[0.03] border-white/5 text-white/40 hover:bg-white/[0.08] hover:text-white hover:border-white/10"
                                )}
                            >
                                {mood.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Identity */}
                <div className="space-y-4">
                    <Label className="text-[10px] font-medium tracking-[0.2em] text-cyan-400/60 uppercase pl-1">
                        Identity
                    </Label>
                    <div className="h-48 w-full -mx-2">
                        <Carousel3D
                            items={[
                                ...AVAILABLE_MODELS.map(m => ({
                                    id: m.id,
                                    label: m.name,
                                    description: m.description,
                                    image: state.thumbnailCache[m.id] || m.image
                                })),
                                ...(state.vrmFile ? [{
                                    id: 'custom',
                                    label: 'Custom',
                                    description: state.vrmFile.name,
                                    image: state.vrmThumbnail || undefined,
                                    icon: <User />
                                }] : [])
                            ]}
                            selectedId={state.vrmFile ? 'custom' : state.selectedCharacter.id}
                            onSelect={(id) => {
                                if (id !== 'custom') actions.setModel(id);
                            }}
                            type="model"
                        />
                    </div>
                    <Button
                        variant="outline"
                        className="w-full h-9 text-[10px] border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-all uppercase tracking-widest text-white/50 hover:text-white"
                        onClick={() => actions.setViewMode('exhibition')}
                    >
                        Display Mode
                    </Button>
                </div>

                {/* Animation */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between pl-1">
                        <Label className="text-[10px] font-medium tracking-[0.2em] text-purple-400/60 uppercase">Animation</Label>
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-mono text-white/30 tracking-wider ">{state.isPlaying ? "active" : "paused"}</span>
                            <Button
                                size="icon"
                                variant="ghost"
                                className={cn(
                                    "size-6 rounded-full transition-all duration-300",
                                    state.isPlaying
                                        ? "bg-purple-500/20 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                                        : "text-white/20 hover:text-white"
                                )}
                                onClick={actions.togglePlay}
                            >
                                {state.isPlaying ? <Pause className="size-3 fill-current" /> : <Play className="size-3 fill-current ml-0.5" />}
                            </Button>
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-4 snap-x custom-scrollbar -mx-2 px-2">
                        {AVAILABLE_ANIMATIONS.map((filename) => {
                            const name = filename.replace(".vrma", "").replace(".fbx", "");
                            const isActive = state.animationUrl.includes(filename);
                            return (
                                <button
                                    key={filename}
                                    onClick={() => actions.setAnimation(filename)}
                                    className={cn(
                                        "flex-none snap-center px-4 py-2.5 rounded-xl text-[10px] font-medium uppercase tracking-wider transition-all duration-300 whitespace-nowrap border",
                                        isActive
                                            ? "bg-purple-500/10 border-purple-500/30 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                                            : "bg-white/[0.03] border-white/5 text-white/40 hover:bg-white/[0.08] hover:text-white hover:border-white/10"
                                    )}
                                >
                                    {name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Voice */}
                <div className="space-y-3">
                    <Label className="text-[10px] font-medium tracking-[0.2em] text-red-400/60 uppercase pl-1">Voice Input</Label>
                    <Button
                        variant="ghost"
                        disabled={state.isChatProcessing && !state.isListening}
                        className={cn(
                            "w-full h-11 border text-[10px] uppercase tracking-[0.15em] transition-all duration-500 rounded-xl relative overflow-hidden group",
                            state.isListening
                                ? "bg-red-500/10 text-red-300 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                                : "bg-white/[0.03] text-white/40 border-white/5 hover:bg-white/[0.08] hover:text-white"
                        )}
                        onClick={onToggleListening}
                    >
                        <div className="relative z-10 flex items-center justify-center gap-3">
                            {state.isListening ? (
                                <>
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                    LISTENING
                                </>
                            ) : (
                                <>
                                    <MicOff className="size-3.5 opacity-50" />
                                    <span>Microphone Off</span>
                                </>
                            )}
                        </div>
                        {state.isListening && <div className="absolute inset-0 bg-red-500/5 animate-pulse-slow" />}
                    </Button>
                    {state.voiceStatus && (
                        <div className={cn(
                            "text-[9px] font-mono text-center tracking-wider uppercase mt-1",
                            state.voiceStatus.includes('error') ? "text-red-400" : "text-white/20"
                        )}>
                            {state.voiceStatus}
                        </div>
                    )}
                </div>


                {/* Data Ingestion */}
                <div className="grid grid-cols-2 gap-3">
                    {/* VRM */}
                    <div className="relative group h-20 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2">
                        <Input
                            type="file"
                            accept=".vrm"
                            onChange={handleVrmUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                            <User className="size-4 text-white/30 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-[9px] font-medium tracking-widest text-white/30 uppercase group-hover:text-white transition-colors">Upload VRM</span>
                    </div>

                    {/* Anim */}
                    <div className="relative group h-20 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2">
                        <Input
                            type="file"
                            accept=".vrma,.fbx,.bvh,.glb"
                            onChange={handleAnimationUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                            <Activity className="size-4 text-white/30 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-[9px] font-medium tracking-widest text-white/30 uppercase group-hover:text-white transition-colors">Upload Anim</span>
                    </div>
                </div>

                {/* Camera Mode */}
                <div className="space-y-3 pt-2">
                    <Label className="text-[10px] font-medium tracking-[0.2em] text-emerald-400/60 uppercase pl-1">Camera</Label>
                    <div className="p-1 bg-black/40 rounded-xl border border-white/5 grid grid-cols-3 gap-1">
                        {[
                            { id: 'face', label: 'Face' },
                            { id: 'half', label: 'Body' },
                            { id: 'full', label: 'Wide' }
                        ].map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => actions.setCameraMode(mode.id)}
                                className={cn(
                                    "py-2 rounded-lg text-[10px] font-medium tracking-wider transition-all duration-300 uppercase",
                                    state.cameraMode === mode.id
                                        ? "bg-white/10 text-white shadow-sm border border-white/5"
                                        : "text-white/30 hover:text-white/60 hover:bg-white/5"
                                )}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-4">
                    <Button
                        variant="ghost"
                        className="w-full h-10 text-white/40 hover:text-white hover:bg-white/5 justify-between px-3 text-[10px] uppercase tracking-wider rounded-xl transition-all"
                        onClick={() => actions.toggleSettings(true)}
                    >
                        <span>System Settings</span>
                        <Settings className="size-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
