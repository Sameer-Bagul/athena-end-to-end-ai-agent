import * as React from "react";
import { ChevronLeft, ChevronRight, Check, X, Camera, Heart, Users, Activity } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { AVAILABLE_MODELS } from "../lib/models";
import ThreeStage, { type ThreeStageHandle } from "./ThreeStage";

interface ExhibitionPageProps {
    onSelect: (modelId: string) => void;
    onCancel: () => void;
    initialModelId: string;
}

export function ExhibitionPage({ onSelect, onCancel, initialModelId }: ExhibitionPageProps) {
    const [currentIndex, setCurrentIndex] = React.useState(() => {
        const idx = AVAILABLE_MODELS.findIndex(m => m.id === initialModelId);
        return idx === -1 ? 0 : idx;
    });

    const currentModel = AVAILABLE_MODELS[currentIndex];
    const [isTransitioning, setIsTransitioning] = React.useState(false);
    const threeStageRef = React.useRef<ThreeStageHandle>(null);

    // Sound Effect
    const playClick = () => {
        const audio = new Audio("sounds/click.mp3");
        audio.volume = 0.4;
        audio.play().catch(e => console.warn("Audio play failed", e));
    };

    // Animation constants for the exhibition
    const EXHIBITION_ANIMATION = "animations/VRMA_03.vrma";

    const handleNext = () => {
        playClick();
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % AVAILABLE_MODELS.length);
            setIsTransitioning(false);
        }, 300);
    };

    const handlePrev = () => {
        playClick();
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + AVAILABLE_MODELS.length) % AVAILABLE_MODELS.length);
            setIsTransitioning(false);
        }, 300);
    };

    const handleTakePhoto = () => {
        const audio = new Audio("sounds/cameraClick.mp3");
        audio.volume = 0.5;
        audio.play().catch(e => console.warn("Camera sound failed", e));

        if (threeStageRef.current) {
            // Request 4K resolution (3840 x 2160)
            const dataUrl = threeStageRef.current.captureScreenshot(3840, 2160);
            if (dataUrl) {
                const link = document.createElement('a');
                link.download = `${currentModel.name.replace(/\s+/g, '_')}_4k_portrait.png`;
                link.href = dataUrl;
                link.click();
            }
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowRight") handleNext();
        if (e.key === "ArrowLeft") handlePrev();
        if (e.key === "Escape") onCancel();
        if (e.key === "Enter") onSelect(currentModel.id);
    };

    React.useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentModel]);

    return (
        <div className="fixed inset-0 z-50 bg-black flex animate-in fade-in duration-500 font-sans selection:bg-primary/20">

            {/* LEFT: 3D Stage (60%) */}
            <div className="w-[60%] h-full relative border-r border-white/10 bg-gradient-to-b from-black/80 to-[#050510]">
                {/* Photo Mode Button */}
                <div className="absolute top-6 left-6 z-20">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleTakePhoto}
                        className="rounded-full bg-black/40 border border-white/10 hover:bg-white/10 hover:scale-110 transition-all text-white/80"
                        title="Take Portrait"
                    >
                        <Camera className="size-5" />
                    </Button>
                </div>

                <div className={cn(
                    "absolute inset-0 transition-opacity duration-300",
                    isTransitioning ? "opacity-0" : "opacity-100"
                )}>
                    <ThreeStage
                        ref={threeStageRef}
                        key={currentModel.id}
                        vrmUrl={`models/${currentModel.file}`}
                        animationUrl={EXHIBITION_ANIMATION}
                        isPlaying={true}
                        animationSpeed={0.8}
                        lightIntensity={1.2}
                        cameraFov={40}
                        shadowsEnabled={true}
                        gridVisible={false}
                        backgroundColor="transparent"
                        cameraMode="full"
                    />
                </div>

                {/* Navigation Overlays */}
                <div className="absolute inset-x-0 bottom-10 flex justify-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
                        <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-[0.2em]">{currentModel.gender} MODEL</span>
                    </div>
                </div>
            </div>

            {/* RIGHT: Info Panel (40%) */}
            <div className="w-[40%] h-full bg-[#09090b] flex flex-col relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 flex flex-col h-full overflow-y-auto custom-scrollbar">
                    {/* Header */}
                    <div className="p-10 pb-6 border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-20">
                        <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h4 className="text-xs font-mono text-primary/80 uppercase tracking-widest border border-primary/20 px-2 py-0.5 rounded-sm bg-primary/5">
                                        Unit {String(currentIndex + 1).padStart(2, '0')}
                                    </h4>
                                    {currentModel.origin && (
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-70">
                                            {currentModel.origin}
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-5xl font-bold tracking-tight text-white mt-2 drop-shadow-lg">{currentModel.name}</h1>
                            </div>

                            <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
                                <X className="size-6" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-muted-foreground/80 mt-2">
                            {currentModel.nature && (
                                <div className="flex items-center gap-2">
                                    <Activity className="size-4 text-secondary" />
                                    <span>{currentModel.nature}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Users className="size-4 text-primary" />
                                <span>{currentModel.voiceStyle} Voice</span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-10 space-y-10">

                        {/* Description */}
                        <div className="space-y-4">
                            <p className="text-lg text-white/90 leading-relaxed font-light">
                                {currentModel.description}
                            </p>
                        </div>

                        {/* Lore Section */}
                        {currentModel.backstory && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-500 delay-100">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-8 h-[1px] bg-primary/50"></span>
                                    Archive Data
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {currentModel.backstory}
                                </p>
                            </div>
                        )}

                        {/* Skills & Attributes Grid */}
                        <div className="grid grid-cols-2 gap-8">
                            {/* Skills */}
                            {(currentModel.skills && currentModel.skills.length > 0) && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Modules / Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {currentModel.skills.map(skill => (
                                            <span key={skill} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 hover:bg-white/10 transition-colors cursor-default">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Hobbies / Likes */}
                            {(currentModel.hobbies && currentModel.hobbies.length > 0) && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Interests</h3>
                                    <div className="space-y-2">
                                        {currentModel.hobbies.map(hobby => (
                                            <div key={hobby} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
                                                <Heart className="size-3 text-secondary/70" />
                                                <span>{hobby}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Relationships */}
                        {currentModel.relationships && (
                            <div className="p-5 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 space-y-2">
                                <span className="text-xs font-mono text-primary/80 uppercase tracking-widest">Network Connections</span>
                                <p className="text-sm text-white/80 leading-relaxed italic">
                                    "{currentModel.relationships}"
                                </p>
                            </div>
                        )}

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="relative z-10 mt-auto p-6 pt-0 flex items-center gap-4 bg-gradient-to-t from-[#09090b] to-transparent">
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-14 rounded-full border-white/10 hover:bg-white/10 hover:border-white/30 transition-all hover:-translate-x-1"
                        onClick={handlePrev}
                    >
                        <ChevronLeft className="size-6" />
                    </Button>

                    <Button
                        className="flex-1 h-14 rounded-full text-lg font-bold tracking-wide bg-white text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                        onClick={() => onSelect(currentModel.id)}
                    >
                        <Check className="size-5 mr-2" />
                        INITIALIZE SYSTEM
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="size-14 rounded-full border-white/10 hover:bg-white/10 hover:border-white/30 transition-all hover:translate-x-1"
                        onClick={handleNext}
                    >
                        <ChevronRight className="size-6" />
                    </Button>
                </div>

            </div>
        </div>
    );
}
