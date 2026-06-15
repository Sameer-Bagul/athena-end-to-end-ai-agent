import * as React from "react";
import { User, LayoutGrid, ChevronLeft, Settings, Play, Pause, X, Smile, Activity, Video, Mic, UploadCloud } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";
import { Carousel3D } from "./ui/Carousel3D";
import { AVAILABLE_MODELS } from "../lib/models";
import { AVAILABLE_ANIMATIONS } from "../lib/animations";
import { useAppStore } from "../context/AppContext";
import { motion } from "framer-motion";
import { OverlaySelect } from "./ui/OverlaySelect";
import { logger } from "../lib/logger";

interface SidePanelProps {
    onToggleListening: () => void;
    onVrmUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAnimationUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onExpressionChange?: (name: string, value: number) => void;
}

export function SidePanel({ onToggleListening, onExpressionChange }: SidePanelProps) {
    const state = useAppStore(s => s.state);
    const actions = useAppStore(s => s.actions);

    const FACIAL_EXPRESSIONS = [
        { name: "Smile", label: "Smile" },
        { name: "Joy", label: "Joy" },
        { name: "Angry", label: "Angry" },
        { name: "Sad", label: "Sad" },
        { name: "Surprised", label: "Surprised" }
    ];

    const [expressionValues, setExpressionValues] = React.useState(() => Object.fromEntries(FACIAL_EXPRESSIONS.map(e => [e.name, 0])));
    const [cameras, setCameras] = React.useState<{ label: string, value: string }[]>([]);
    const [overlayType, setOverlayType] = React.useState<'expression' | 'animation' | 'camera' | null>(null);

    React.useEffect(() => {
        const getCameras = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(d => d.kind === "videoinput");
                setCameras(videoDevices.map(d => ({
                    label: d.label || `Camera ${d.deviceId.slice(0, 5)}`,
                    value: d.deviceId
                })));
            } catch (err) {
                logger.error("Failed to list cameras in UI:", err);
            }
        };
        getCameras();
    }, []);

    const handleExpressionChange = React.useCallback((name: string, value: number) => {
        setExpressionValues(v => ({ ...v, [name]: value }));
        if (onExpressionChange) {
            onExpressionChange(name, value);
        }
    }, [onExpressionChange]);

    const handleVrmUpload = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            actions.setVrmFile(e.target.files[0]);
        }
    }, [actions]);

    const handleAnimationUpload = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            actions.setAnimationFile(e.target.files[0]);
        }
    }, [actions]);

    // --- Collapsed View (Floating Icon) ---
    if (state.isLeftCollapsed) {
        return (
            <div className="fixed bottom-8 left-8 z-100">
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

    const currentExpression = Object.entries(expressionValues).find(([name]) => expressionValues[name] > 0.1)?.[0] || 'Neutral';
    const currentAnimation = AVAILABLE_ANIMATIONS.find(f => state.animationUrl.includes(f))?.replace(".vrma", "").toUpperCase() || "Select Sequence";
    const currentCamera = cameras.find(c => c.value === state.cameraDeviceId)?.label || "Select Optic";

    return (
        <div className="h-full flex flex-col relative w-full font-sans bg-transparent selection:bg-white selection:text-black overflow-x-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-8 shrink-0 relative z-10">
                <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-white/40 tracking-[0.3em] uppercase mb-1">Active Model</span>
                    <h2 className="text-xl font-light text-white tracking-tight">{state.selectedCharacter.name}</h2>
                </div>
                <button
                    onClick={actions.toggleLeftCollapse}
                    className="size-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                >
                    <X className="size-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6 flex flex-col gap-8 custom-scrollbar relative z-10">
                
                {/* 3D Model Carousel */}
                <div className="space-y-3">
                    <span className="text-[10px] font-medium text-white/30 tracking-[0.2em] uppercase ml-1">Identity</span>
                    <div className="h-44 w-full rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
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
                                    label: 'Custom Model',
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

                {/* Minimalist Controls */}
                <div className="space-y-2">
                    <span className="text-[10px] font-medium text-white/30 tracking-[0.2em] uppercase ml-1 block mb-3">Behaviors</span>
                    
                    <button 
                        onClick={() => setOverlayType('expression')}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-xl bg-white/5 text-white/50 group-hover:text-white/80 transition-colors">
                                <Smile className="size-4" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Expression</span>
                                <span className="text-sm text-white/90 font-light">{currentExpression}</span>
                            </div>
                        </div>
                        <ChevronLeft className="size-4 -rotate-90 text-white/20 group-hover:text-white/40 transition-colors" />
                    </button>

                    <button 
                        onClick={() => setOverlayType('animation')}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-xl bg-white/5 text-white/50 group-hover:text-white/80 transition-colors">
                                <Activity className="size-4" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Sequence</span>
                                <span className="text-sm text-white/90 font-light truncate max-w-[150px]">{currentAnimation}</span>
                            </div>
                        </div>
                        <ChevronLeft className="size-4 -rotate-90 text-white/20 group-hover:text-white/40 transition-colors" />
                    </button>

                    <button 
                        onClick={() => setOverlayType('camera')}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-xl bg-white/5 text-white/50 group-hover:text-white/80 transition-colors">
                                <Video className="size-4" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Optical Sensor</span>
                                <span className="text-sm text-white/90 font-light truncate max-w-[150px]">{currentCamera}</span>
                            </div>
                        </div>
                        <ChevronLeft className="size-4 -rotate-90 text-white/20 group-hover:text-white/40 transition-colors" />
                    </button>
                </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-auto p-6 border-t border-white/5 bg-[#020205]/50 backdrop-blur-xl flex flex-col gap-4">
                
                {/* Active States */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={actions.togglePlay}
                        className={cn(
                            "flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-medium uppercase tracking-wider transition-all",
                            state.isPlaying 
                                ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                                : "bg-white/[0.02] border border-white/5 text-white/50 hover:bg-white/[0.05]"
                        )}
                    >
                        {state.isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                        {state.isPlaying ? "Active" : "Paused"}
                    </button>

                    <button
                        onClick={onToggleListening}
                        className={cn(
                            "flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-medium uppercase tracking-wider transition-all",
                            state.isListening 
                                ? "bg-primary text-black shadow-[0_0_15px_var(--primary-glow,rgba(0,255,255,0.3))]" 
                                : "bg-white/[0.02] border border-white/5 text-white/50 hover:bg-white/[0.05]"
                        )}
                    >
                        <Mic className="size-3.5" />
                        {state.isListening ? "Listening" : "Muted"}
                    </button>
                </div>

                {/* Utility Icons */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-2">
                        <label className="size-10 flex items-center justify-center rounded-xl bg-white/[0.02] hover:bg-white/10 border border-white/5 cursor-pointer transition-colors text-white/40 hover:text-white" title="Upload VRM Model">
                            <Input type="file" accept=".vrm" onChange={handleVrmUpload} className="hidden" />
                            <User className="size-4" />
                        </label>
                        <label className="size-10 flex items-center justify-center rounded-xl bg-white/[0.02] hover:bg-white/10 border border-white/5 cursor-pointer transition-colors text-white/40 hover:text-white" title="Upload Animation">
                            <Input type="file" accept=".vrma,.fbx" onChange={handleAnimationUpload} className="hidden" />
                            <UploadCloud className="size-4" />
                        </label>
                    </div>

                    <button
                        onClick={() => actions.toggleSettings(true)}
                        className="size-10 flex items-center justify-center rounded-xl bg-white/[0.02] hover:bg-white/10 border border-white/5 transition-colors text-white/40 hover:text-white"
                        title="System Settings"
                    >
                        <Settings className="size-4" />
                    </button>
                </div>
            </div>

            {/* Selection Overlays */}
            <OverlaySelect
                isOpen={overlayType === 'expression'}
                onClose={() => setOverlayType(null)}
                title="Neural Expressions"
                value={currentExpression}
                options={[
                    { label: "Neutral // Reset", value: "Neutral", description: "Default host state" },
                    { label: "Joy // High Valence", value: "Joy", description: "Positive neural patterns" },
                    { label: "Sadness // Low Valence", value: "Sad", description: "Negative neural patterns" },
                    { label: "Anger // Reactive", value: "Angry", description: "Hostile response" },
                    { label: "Surprised // Alert", value: "Surprised", description: "Analyzing anomaly" }
                ]}
                onChange={(val) => {
                    const moods: Record<string, Record<string, number>> = { Neutral: {}, Joy: { Joy: 1 }, Sad: { Sad: 1 }, Angry: { Angry: 1 }, Surprised: { Surprised: 1 } };
                    const preset = moods[val] || {};
                    FACIAL_EXPRESSIONS.forEach(e => handleExpressionChange(e.name, 0));
                    Object.entries(preset).forEach(([k, v]) => handleExpressionChange(k, v as number));
                }}
            />

            <OverlaySelect
                isOpen={overlayType === 'animation'}
                onClose={() => setOverlayType(null)}
                title="Kinetic Sequences"
                value={AVAILABLE_ANIMATIONS.find(f => state.animationUrl.includes(f)) || ""}
                options={AVAILABLE_ANIMATIONS.map(filename => ({
                    label: filename.replace(".vrma", "").toUpperCase(),
                    value: filename,
                    description: "Neural-motor directive"
                }))}
                onChange={(val) => actions.setAnimation(val)}
            />

            <OverlaySelect
                isOpen={overlayType === 'camera'}
                onClose={() => setOverlayType(null)}
                title="Optical Sensors"
                value={state.cameraDeviceId}
                options={[
                    { label: "Default Sensor", value: "", description: "System primary" },
                    ...cameras.map(c => ({ label: c.label, value: c.value, description: "External Link" }))
                ]}
                onChange={(val) => actions.setCameraDeviceId(val)}
            />
        </div>
    );
}
