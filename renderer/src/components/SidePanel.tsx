import * as React from "react";
import { User, LayoutGrid, ChevronLeft, Upload, Settings, Play, Pause, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";
import { Carousel3D } from "./ui/Carousel3D";
import { ControlModule } from "./ui/ControlModule";
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

    return (
        <div className="h-full flex flex-col relative w-full font-sans bg-[#050505] selection:bg-white selection:text-black overflow-x-hidden border-r border-white/5">
            {/* Full Panel Doodle Background */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.3] mix-blend-screen z-0"
                style={{
                    backgroundImage: `url('doodle.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-6 h-16 shrink-0 border-b border-white/5 relative z-10">
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-white/50 uppercase tracking-[0.2em]">{state.selectedCharacter.name}</span>
                    <h2 className="text-[13px] font-black text-white leading-tight tracking-tight uppercase">Core Controller</h2>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={actions.toggleLeftCollapse}
                        className="text-white/40 hover:text-white transition-colors"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-6 flex flex-col gap-4 custom-scrollbar relative z-10">

                <div className="flex flex-col relative z-10 gap-4">
                    {/* Module 01: Host Identity */}
                    <ControlModule title="Choose Model">
                        <div className="space-y-4">
                            <div className="h-44 w-full">
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
                    </ControlModule>

                    {/* Module 02: Neural Mood */}
                    <ControlModule title="Expression">
                        <Button
                            variant="ghost"
                            className="w-full h-11 border border-white/10 bg-white/2 text-[11px] font-medium transition-all flex items-center justify-between rounded-xl px-4 hover:bg-white/5 hover:border-white/20"
                            onClick={() => setOverlayType('expression')}
                        >
                            <span className="text-white/60">
                                {Object.entries(expressionValues).find(([name]) => expressionValues[name] > 0.1)?.[0] || 'Neutral // Idle'}
                            </span>
                            <ChevronLeft className="size-3.5 -rotate-90 opacity-30" />
                        </Button>
                    </ControlModule>

                    {/* Module 03: Kinetic Stream */}
                    <ControlModule title="Animation">
                        <div className="space-y-3">
                            <Button
                                variant="ghost"
                                className="w-full h-11 border border-white/10 bg-white/2 text-[11px] font-medium transition-all flex items-center justify-between rounded-xl px-4 hover:bg-white/5 hover:border-white/20"
                                onClick={() => setOverlayType('animation')}
                            >
                                <span className="text-white/60 truncate">
                                    {AVAILABLE_ANIMATIONS.find(f => state.animationUrl.includes(f))?.replace(".vrma", "").toUpperCase() || "Select Sequence"}
                                </span>
                                <ChevronLeft className="size-3.5 -rotate-90 opacity-30" />
                            </Button>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full h-10 border text-[11px] tracking-[0.2em] font-mono uppercase transition-all rounded-xl justify-between px-4",
                                    state.isPlaying ? "bg-white text-black" : "border-white/20 text-white/50"
                                )}
                                onClick={actions.togglePlay}
                            >
                                <span className="font-bold">{state.isPlaying ? "STREAM_ACTIVE" : "STREAM_PAUSED"}</span>
                                {state.isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                            </Button>
                        </div>
                    </ControlModule>

                    {/* Module 04: Comms Link */}
                    <ControlModule title="Camera and Microphone">
                        <div className="space-y-3">
                            <Button
                                variant="ghost"
                                className="w-full h-11 border border-white/10 bg-white/2 text-[11px] font-medium transition-all flex items-center justify-between rounded-xl px-4 hover:bg-white/5 hover:border-white/20"
                                onClick={() => setOverlayType('camera')}
                            >
                                <span className="text-white/60 truncate">
                                    {cameras.find(c => c.value === state.cameraDeviceId)?.label || "Select Optic"}
                                </span>
                                <ChevronLeft className="size-3.5 -rotate-90 opacity-30" />
                            </Button>
                            <Button
                                onClick={onToggleListening}
                                variant="ghost"
                                className={cn(
                                    "w-full h-10 border text-[11px] tracking-[0.2em] font-mono uppercase transition-all rounded-xl",
                                    state.isListening ? "bg-white text-black" : "border-white/20 text-white/50"
                                )}
                            >
                                {state.isListening ? "LINK_ACTIVE" : "LINK_STANDBY"}
                            </Button>
                        </div>
                    </ControlModule>

                    {/* Module 05: Maintenance */}
                    <ControlModule title="Resources" defaultOpen={false}>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <label className="relative h-12 border border-white/10 bg-white/2 hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center gap-2 rounded-xl">
                                    <Input type="file" accept=".vrm" onChange={handleVrmUpload} className="hidden" />
                                    <Upload className="size-3 text-white/30" />
                                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">VRM</span>
                                </label>
                                <label className="relative h-12 border border-white/10 bg-white/2 hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center gap-2 rounded-xl">
                                    <Input type="file" accept=".vrma,.fbx" onChange={handleAnimationUpload} className="hidden" />
                                    <Upload className="size-3 text-white/30" />
                                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">ANIM</span>
                                </label>
                            </div>
                        </div>
                    </ControlModule>

                    {/* Module 06: Settings */}
                    <ControlModule title="Settings" defaultOpen={false}>
                        <div className="space-y-3">
                            <Button
                                variant="ghost"
                                className="w-full h-11 border border-white/10 bg-white/2 hover:bg-white/5 text-[11px] font-medium transition-all flex items-center justify-between rounded-xl px-4 hover:border-white/20"
                                onClick={() => actions.toggleSettings(true)}
                            >
                                <span className="text-white/60">Open Configuration</span>
                                <Settings className="size-4 text-white/30" />
                            </Button>
                        </div>
                    </ControlModule>
                </div>
            </div>

            {/* Selection Overlays */}
            <OverlaySelect
                isOpen={overlayType === 'expression'}
                onClose={() => setOverlayType(null)}
                title="Neural Expressions"
                value={Object.entries(expressionValues).find(([name]) => expressionValues[name] > 0.1)?.[0] || 'Neutral'}
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
