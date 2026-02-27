import * as React from "react";
import { User, Activity, Play, Pause, Settings, LayoutGrid, Palette, ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "../lib/utils";
import { Carousel3D } from "./ui/Carousel3D";
import { AVAILABLE_MODELS } from "../lib/models";
import { AVAILABLE_ANIMATIONS } from "../lib/animations";
import { useAppStore } from "../context/AppContext";
import { motion } from "framer-motion";

interface SidePanelProps {
    onToggleListening: () => void;
    onVrmUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAnimationUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onExpressionChange?: (name: string, value: number) => void;
}

export function SidePanel({ onToggleListening, onVrmUpload: _externalVrm, onAnimationUpload: _externalAnim, onExpressionChange }: SidePanelProps) {
    const { state, actions } = useAppStore();

    // --- Collapsed View (Floating Icon) ---
    if (state.isLeftCollapsed) {
        return (
            <div className="fixed bottom-8 left-8 z-[100]">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button
                        onClick={actions.toggleLeftCollapse}
                        className="size-14 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/20 bg-black text-white hover:bg-white/10 transition-all duration-300"
                    >
                        <LayoutGrid className="size-6" />
                    </Button>
                </motion.div>
            </div>
        );
    }

    const FACIAL_EXPRESSIONS = [
        { name: "Smile", label: "Smile" },
        { name: "Joy", label: "Joy" },
        { name: "Angry", label: "Angry" },
        { name: "Sad", label: "Sad" },
        { name: "Surprised", label: "Surprised" },
        { name: "EyeSmileLeft", label: "Eye Smile L" },
        { name: "EyeSmileRight", label: "Eye Smile R" }
    ];

    const [expressionValues, setExpressionValues] = React.useState(() => Object.fromEntries(FACIAL_EXPRESSIONS.map(e => [e.name, 0])));

    const handleExpressionChange = (name: string, value: number) => {
        setExpressionValues(v => ({ ...v, [name]: value }));
        if (onExpressionChange) {
            onExpressionChange(name, value);
        }
    };

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

    // --- Expanded View (Modern Monochrome) ---
    return (
        <div className="h-full flex flex-col relative w-full font-sans bg-black">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-transparent">
                <div className="flex items-center gap-2">
                    <div className="size-5 flex items-center justify-center border border-white/20">
                        <Palette className="size-3 text-white/60" />
                    </div>
                    <span className="text-[10px] font-black tracking-[0.4em] uppercase text-white">Console</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={actions.toggleLeftCollapse}
                    className="size-8 text-white/20 hover:text-white hover:bg-white/5 rounded-none"
                >
                    <ChevronLeft className="size-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-12 custom-scrollbar">

                {/* Mood Presets */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-2">
                        <Label className="text-[9px] font-bold tracking-[0.3em] text-white/30 uppercase">Protocol // Mood</Label>
                        <div className="h-[1px] flex-1 bg-white/5" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: "Neutral", value: "Neutral", preset: {} },
                            { label: "Joy", value: "Joy", preset: { Joy: 1.0 } },
                            { label: "Sadness", value: "Sad", preset: { Sad: 1.0 } },
                            { label: "Anger", value: "Angry", preset: { Angry: 1.0 } },
                            { label: "Inquiry", value: "Surprised", preset: { Surprised: 1.0 } },
                            { label: "Relax", value: "Fun", preset: { Fun: 0.7, Blink: 0.1 } }
                        ].map((mood) => (
                            <button
                                key={mood.label}
                                onClick={() => {
                                    const allKeys = ["Joy", "Sad", "Angry", "Surprised", "Relax", "Fun", "Neutral", "Smile", "Frown", "Blink", "EyeSmileLeft", "EyeSmileRight"];
                                    const resetState: any = {};
                                    allKeys.forEach(k => {
                                        resetState[k] = 0;
                                        handleExpressionChange(k, 0);
                                    });
                                    Object.entries(mood.preset).forEach(([key, val]) => {
                                        handleExpressionChange(key, val as number);
                                        resetState[key] = val;
                                    });
                                    setExpressionValues(resetState);
                                }}
                                className={cn(
                                    "py-3 px-4 text-[9px] font-mono tracking-widest uppercase transition-all duration-300 border",
                                    (expressionValues[mood.value] || 0) > 0.1
                                        ? "bg-white text-black border-white"
                                        : "bg-transparent border-white/10 text-white/40 hover:border-white/30 hover:text-white"
                                )}
                            >
                                {mood.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Identity Engine */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-2">
                        <Label className="text-[9px] font-bold tracking-[0.3em] text-white/30 uppercase">Neural // Host</Label>
                        <div className="h-[1px] flex-1 bg-white/5" />
                    </div>
                    <div className="h-44 w-full -mx-2">
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
                </div>

                {/* Animation Matrix */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-[9px] font-bold tracking-[0.3em] text-white/30 uppercase">Motion // Stream</Label>
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                                "size-6 rounded-none transition-all",
                                state.isPlaying ? "bg-white text-black" : "text-white/20 hover:text-white"
                            )}
                            onClick={actions.togglePlay}
                        >
                            {state.isPlaying ? <Pause className="size-3 fill-current" /> : <Play className="size-3 fill-current" />}
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {AVAILABLE_ANIMATIONS.map((filename) => {
                            const name = filename.replace(".vrma", "").replace(".fbx", "");
                            const isActive = state.animationUrl.includes(filename);
                            return (
                                <button
                                    key={filename}
                                    onClick={() => actions.setAnimation(filename)}
                                    className={cn(
                                        "px-3 py-2 text-[8px] font-mono uppercase tracking-widest border transition-all",
                                        isActive
                                            ? "bg-white text-black border-white"
                                            : "bg-transparent border-white/5 text-white/30 hover:border-white/20 hover:text-white"
                                    )}
                                >
                                    {name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Audio Interface */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-2">
                        <Label className="text-[9px] font-bold tracking-[0.3em] text-white/30 uppercase">Comms // Link</Label>
                        <div className="h-[1px] flex-1 bg-white/5" />
                    </div>
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full h-11 border text-[9px] tracking-[0.2em] font-mono uppercase transition-all rounded-none",
                            state.isListening
                                ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                : "bg-transparent border-white/10 text-white/30 hover:text-white hover:border-white/30"
                        )}
                        onClick={onToggleListening}
                    >
                        {state.isListening ? "LINK_ACTIVE" : "LINK_STANDBY"}
                    </Button>
                </div>

                {/* Secure Uploads */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="relative group h-20 border border-white/5 bg-transparent hover:border-white/20 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2">
                        <Input
                            type="file"
                            accept=".vrm"
                            onChange={handleVrmUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <Activity className="size-4 text-white/20 group-hover:text-white transition-colors" />
                        <span className="text-[7px] font-mono tracking-widest text-white/20 uppercase group-hover:text-white">UP_VRM</span>
                    </div>

                    <div className="relative group h-20 border border-white/5 bg-transparent hover:border-white/20 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2">
                        <Input
                            type="file"
                            accept=".vrma,.fbx,.bvh,.glb"
                            onChange={handleAnimationUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <Activity className="size-4 text-white/20 group-hover:text-white transition-colors" />
                        <span className="text-[7px] font-mono tracking-widest text-white/20 uppercase group-hover:text-white">UP_ANIM</span>
                    </div>
                </div>

                {/* System Ops */}
                <div className="mt-4 border-t border-white/5 pt-4 flex flex-col gap-2">
                    <Button
                        variant="ghost"
                        className="w-full h-8 text-white/20 hover:text-white hover:bg-white/5 flex justify-between px-2 text-[8px] uppercase tracking-[0.2em] font-mono rounded-none"
                        onClick={() => actions.toggleSettings(true)}
                    >
                        <span>CONFIG_SYS</span>
                        <Settings className="size-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
