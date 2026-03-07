import * as React from "react";
import { User, Play, Pause, Settings, LayoutGrid, ChevronLeft, Upload, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import { Carousel3D } from "./ui/Carousel3D";
import { ControlModule } from "./ui/ControlModule";
import { IndustrialSelect } from "./ui/IndustrialSelect";
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
        <div className="h-full flex flex-col relative w-full font-sans bg-transparent selection:bg-white selection:text-black overflow-x-hidden border-r border-white/5">
            {/* Header - Unified */}
            <div className="flex items-center justify-between px-6 h-16 shrink-0 border-b border-white/[0.03]">
                <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-white/40">Core</span>
                    <h2 className="text-[15px] font-semibold text-white/90 leading-tight">Systems</h2>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => actions.setViewMode('exhibition')}
                        className="h-7 text-[10px] font-medium text-white/30 hover:text-white hover:bg-white/[0.03] transition-all px-3 rounded-md"
                    >
                        Models
                    </Button>
                    <button
                        onClick={actions.toggleLeftCollapse}
                        className="text-white/20 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 flex flex-col gap-3 custom-scrollbar relative">
                {/* Subtle Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />

                <div className="flex flex-col relative z-10 gap-3">
                    {/* Module 01: Host Identity */}
                    <ControlModule id="MOD_01" title="Host Identity" defaultOpen={true}>
                        <div className="space-y-4">
                            <div className="h-48 w-full">
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
                            <div className="bg-white/[0.04] border border-white/10 p-4 rounded-xl">
                                <div className="flex justify-between items-center mb-1.5">
                                    <h4 className="text-[12px] font-black uppercase italic tracking-widest text-white">
                                        {state.vrmFile ? 'CUSTOM_RIG' : state.selectedCharacter.name}
                                    </h4>
                                    <Badge variant="outline" className="rounded-full border-white/30 text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 bg-white/10 text-white">Active</Badge>
                                </div>
                                <p className="text-[10px] text-white/50 uppercase tracking-[0.15em] font-mono leading-relaxed">
                                    {state.vrmFile ? state.vrmFile.name : (state.selectedCharacter as any).bio || "No BIOS profile detected."}
                                </p>
                            </div>
                        </div>
                    </ControlModule>

                    {/* Module 02: Neural Mood */}
                    <ControlModule id="MOD_02" title="Neural Mood" defaultOpen={true}>
                        <div className="space-y-3">
                            <IndustrialSelect
                                value={Object.entries(expressionValues).find(([_, v]) => v > 0.1)?.[0] || 'Neutral'}
                                options={[
                                    { label: "Neutral // Default", value: "Neutral", description: "Standard calibration mode" },
                                    { label: "Joy // Positive", value: "Joy", description: "High valence neural state" },
                                    { label: "Sadness // Negative", value: "Sad", description: "Low valence neural state" },
                                    { label: "Anger // Reactive", value: "Angry", description: "Hostile response pattern" },
                                    { label: "Inquiry // Alert", value: "Surprised", description: "Analytical focus increased" },
                                    { label: "Relax // Passive", value: "Fun", description: "Idle power conservation" }
                                ]}
                                onChange={(val) => {
                                    const moods: Record<string, any> = {
                                        Neutral: {},
                                        Joy: { Joy: 1.0 },
                                        Sad: { Sad: 1.0 },
                                        Angry: { Angry: 1.0 },
                                        Surprised: { Surprised: 1.0 },
                                        Fun: { Fun: 0.7, Blink: 0.1 }
                                    };
                                    const preset = moods[val] || {};
                                    const allKeys = ["Joy", "Sad", "Angry", "Surprised", "Relax", "Fun", "Neutral", "Smile", "Frown", "Blink", "EyeSmileLeft", "EyeSmileRight"];
                                    const resetState: any = {};
                                    allKeys.forEach(k => {
                                        resetState[k] = 0;
                                        handleExpressionChange(k, 0);
                                    });
                                    Object.entries(preset).forEach(([key, val]) => {
                                        handleExpressionChange(key, val as number);
                                        resetState[key] = val;
                                    });
                                    setExpressionValues(resetState);
                                }}
                            />
                        </div>
                    </ControlModule>

                    {/* Module 03: Kinetic Stream */}
                    <ControlModule id="MOD_03" title="Kinetic Stream" defaultOpen={true}>
                        <div className="space-y-3">
                            <IndustrialSelect
                                placeholder="SELECT_MOTION"
                                value={AVAILABLE_ANIMATIONS.find(f => state.animationUrl.includes(f)) || ""}
                                options={AVAILABLE_ANIMATIONS.map(filename => ({
                                    label: filename.replace(".vrma", "").replace(".fbx", "").toUpperCase(),
                                    value: filename,
                                    description: "Execution sequence"
                                }))}
                                onChange={(val) => actions.setAnimation(val)}
                            />
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full h-10 border text-[11px] tracking-[0.2em] font-mono uppercase transition-all rounded-xl justify-between px-4",
                                    state.isPlaying
                                        ? "bg-white text-black border-white shadow-[0_4px_15px_rgba(255,255,255,0.15)]"
                                        : "border-white/20 text-white/50 hover:text-white hover:border-white/50 hover:bg-white/[0.05]"
                                )}
                                onClick={actions.togglePlay}
                            >
                                <span className="font-bold">{state.isPlaying ? "STREAM_ACTIVE" : "STREAM_PAUSED"}</span>
                                {state.isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                            </Button>
                        </div>
                    </ControlModule>

                    {/* Module 04: Comms Link */}
                    <ControlModule id="MOD_04" title="Comms Link" defaultOpen={true}>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full h-10 border text-[11px] tracking-[0.2em] font-mono uppercase transition-all rounded-xl",
                                state.isListening
                                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                                    : "bg-transparent border-white/20 text-white hover:text-white hover:border-white/50 hover:bg-white/[0.05]"
                            )}
                            onClick={onToggleListening}
                        >
                            <span className="font-bold">{state.isListening ? "LINK_ACTIVE" : "LINK_STANDBY"}</span>
                        </Button>
                    </ControlModule>

                    {/* Module 05: Maintenance */}
                    <ControlModule id="MOD_05" title="Maintenance" defaultOpen={false}>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative group h-14 border border-white/10 bg-black/40 hover:border-white/40 hover:bg-white/[0.05] transition-all cursor-pointer overflow-hidden flex items-center justify-center gap-2 rounded-xl">
                                    <Input
                                        type="file"
                                        accept=".vrm"
                                        onChange={handleVrmUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <Upload className="size-4 text-white/40 group-hover:text-white transition-all" />
                                    <span className="text-[9px] font-mono tracking-[0.2em] text-white/40 uppercase group-hover:text-white font-bold">UP_VRM</span>
                                </div>
                                <div className="relative group h-14 border border-white/10 bg-black/40 hover:border-white/40 hover:bg-white/[0.05] transition-all cursor-pointer overflow-hidden flex items-center justify-center gap-2 rounded-xl">
                                    <Input
                                        type="file"
                                        accept=".vrma,.fbx,.bvh,.glb"
                                        onChange={handleAnimationUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <Upload className="size-4 text-white/40 group-hover:text-white transition-all" />
                                    <span className="text-[9px] font-mono tracking-[0.2em] text-white/40 uppercase group-hover:text-white font-bold">UP_ANIM</span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-10 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all flex justify-between px-4 text-[9px] uppercase tracking-[0.3em] font-mono rounded-xl"
                                onClick={() => actions.toggleSettings(true)}
                            >
                                <span className="font-bold">SYSTEM_CONFIG</span>
                                <Settings className="size-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-10 border border-red-500/20 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all flex justify-between px-4 text-[9px] uppercase tracking-[0.3em] font-mono rounded-xl"
                                onClick={() => actions.clearChat()}
                            >
                                <span className="font-bold">PURGE_MODEM</span>
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    </ControlModule>
                </div>
            </div>
        </div>
    );
}
