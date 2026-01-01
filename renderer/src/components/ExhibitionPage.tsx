import * as React from "react";
import { ChevronLeft, ChevronRight, Check, X, Box } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { AVAILABLE_MODELS } from "../lib/models";
import ThreeStage from "./ThreeStage";

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

    // Animation constants for the exhibition
    // VRMA_03.vrma is the user requested "Idle" pose for exhibition
    const EXHIBITION_ANIMATION = "animations/VRMA_03.vrma";

    const handleNext = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % AVAILABLE_MODELS.length);
            setIsTransitioning(false);
        }, 300);
    };

    const handlePrev = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + AVAILABLE_MODELS.length) % AVAILABLE_MODELS.length);
            setIsTransitioning(false);
        }, 300);
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
        <div className="fixed inset-0 z-50 bg-black flex animate-in fade-in duration-500">

            {/* LEFT: 3D Stage (60%) */}
            <div className="w-[60%] h-full relative border-r border-white/10 bg-black/50">
                <div className={cn(
                    "absolute inset-0 transition-opacity duration-300",
                    isTransitioning ? "opacity-0" : "opacity-100"
                )}>
                    <ThreeStage
                        key={currentModel.id} // Force re-mount or use internal update? Re-mount ensures clean state for exhibition.
                        vrmUrl={`models/${currentModel.file}`}
                        animationUrl={EXHIBITION_ANIMATION}
                        isPlaying={true} // Always match play
                        animationSpeed={0.8} // Slightly faster for showcase
                        lightIntensity={1.2}
                        cameraFov={45} // More cinematic
                        shadowsEnabled={true}
                        gridVisible={false} // Clean look
                        backgroundColor="#050510"
                        cameraMode="full" // Full body view
                    // No thumbnail generation needed here
                    />
                </div>

                {/* Navigation Overlays */}
                <div className="absolute inset-x-0 bottom-10 flex justify-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
                        <span className="text-[10px] uppercase font-mono text-muted-foreground">Exhibition Mode</span>
                    </div>
                </div>
            </div>

            {/* RIGHT: Info Panel (40%) */}
            <div className="w-[40%] h-full bg-[#09090b] flex flex-col relative p-10 overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px]" />
                </div>

                {/* Header */}
                <div className="relative z-10 flex justify-between items-start">
                    <div className="space-y-1">
                        <h4 className="text-sm font-mono text-primary uppercase tracking-widest">Model {currentIndex + 1} / {AVAILABLE_MODELS.length}</h4>
                        <h1 className="text-5xl font-bold tracking-tight text-white">{currentModel.name}</h1>
                    </div>

                    <Button variant="outline" size="icon" onClick={onCancel} className="rounded-full border-white/10 hover:bg-white/10">
                        <X className="size-5" />
                    </Button>
                </div>

                {/* Stats / Info */}
                <div className="relative z-10 mt-10 space-y-8 flex-1">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white/80">Profile</h3>
                        <p className="text-muted-foreground leading-relaxed text-lg">
                            {currentModel.description || "A highly compatible VRM avatar module designed for versatile interaction protocols. Optimized for speech synthesis and emotional expression."}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Voice ID</span>
                            <p className="text-xl font-mono text-white mt-1">{currentModel.voiceStyle}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Format</span>
                            <p className="text-xl font-mono text-white mt-1">VRM 1.0</p>
                        </div>
                    </div>

                    {/* Tech Specs Decoration */}
                    <div className="space-y-2 pt-10 border-t border-white/5">
                        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/50">
                            <Box className="size-3" />
                            <span>POLYCOUNT_OPTIMIZED</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/50">
                            <Box className="size-3" />
                            <span>BLENDSHAPES_ACTIVE</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/50">
                            <Box className="size-3" />
                            <span>PHYSICS_ENABLED</span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="relative z-10 mt-auto pt-6 flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-14 rounded-full border-white/20 hover:bg-white/10 hover:border-white/50 transition-all"
                        onClick={handlePrev}
                    >
                        <ChevronLeft className="size-6" />
                    </Button>

                    <Button
                        className="flex-1 h-14 rounded-full text-lg font-bold tracking-wide bg-white text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02]"
                        onClick={() => onSelect(currentModel.id)}
                    >
                        <Check className="size-5 mr-2" />
                        INITIALIZE MODULE
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="size-14 rounded-full border-white/20 hover:bg-white/10 hover:border-white/50 transition-all"
                        onClick={handleNext}
                    >
                        <ChevronRight className="size-6" />
                    </Button>
                </div>

            </div>
        </div>
    );
}
