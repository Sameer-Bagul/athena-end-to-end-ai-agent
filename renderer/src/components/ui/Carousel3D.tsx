import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, User, FileVideo } from "lucide-react";
import { cn } from "../../lib/utils";

interface CarouselItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    image?: string;
    description?: string;
}

interface Carousel3DProps {
    items: CarouselItem[];
    selectedId: string;
    onSelect: (id: string) => void;
    type?: "model" | "animation";
}

export function Carousel3D({ items, selectedId, onSelect, type = "model" }: Carousel3DProps) {
    // Find index of selected item, default to 0
    const selectedIndex = items.findIndex((item) => item.id === selectedId);
    const [activeIndex, setActiveIndex] = React.useState(selectedIndex >= 0 ? selectedIndex : 0);

    // Audio Ref
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    // Sync internal state if prop changes externally
    React.useEffect(() => {
        const idx = items.findIndex((item) => item.id === selectedId);
        if (idx >= 0 && idx !== activeIndex) {
            setActiveIndex(idx);
        }
    }, [selectedId, items]);

    // Initialize Audio
    React.useEffect(() => {
        audioRef.current = new Audio("sounds/click.mp3");
        audioRef.current.volume = 0.5;
    }, []);

    const playClickSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.warn("Audio play failed", e));
        }
    };

    const handleNext = () => {
        playClickSound();
        const nextIndex = (activeIndex + 1) % items.length;
        setActiveIndex(nextIndex);
        onSelect(items[nextIndex].id);
    };

    const handlePrev = () => {
        playClickSound();
        const prevIndex = (activeIndex - 1 + items.length) % items.length;
        setActiveIndex(prevIndex);
        onSelect(items[prevIndex].id);
    };

    // Drag Logic
    // const x = useMotionValue(0); // Removed unused variable
    const handleDragEnd = (_: any, info: { offset: { x: number; }; velocity: { x: number; }; }) => {
        if (info.offset.x < -50 || info.velocity.x < -500) {
            handleNext();
        } else if (info.offset.x > 50 || info.velocity.x > 500) {
            handlePrev();
        }
    };

    // Calculate visible items: [prev, current, next]
    const getVisibleItems = () => {
        const len = items.length;
        if (len === 0) return [];

        const prevIndex = (activeIndex - 1 + len) % len;
        const nextIndex = (activeIndex + 1) % len;

        return [
            { ...items[prevIndex], position: "left", index: prevIndex },
            { ...items[activeIndex], position: "center", index: activeIndex },
            { ...items[nextIndex], position: "right", index: nextIndex },
        ];
    };

    const visibleItems = getVisibleItems();

    return (
        <div className="relative w-full h-full flex items-center justify-center perspective-1000 group">

            {/* Navigation Areas/Buttons */}
            <button
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-0 z-30 p-1.5 rounded-full bg-black/40 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-200 transition-all border border-white/5 opacity-0 group-hover:opacity-100"
            >
                <ChevronLeft className="size-4" />
            </button>

            <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-0 z-30 p-1.5 rounded-full bg-black/40 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-200 transition-all border border-white/5 opacity-0 group-hover:opacity-100"
            >
                <ChevronRight className="size-4" />
            </button>

            {/* 3D Cards Container */}
            <div className="relative w-full h-full flex items-center justify-center">
                <AnimatePresence mode="popLayout" initial={false}>
                    {visibleItems.map((item) => {
                        const isCenter = item.position === "center";
                        const isLeft = item.position === "left";

                        let xPos = "0%";
                        let scale = 1;
                        let zIndex = 10;
                        let opacity = 1;
                        let rotateY = "0deg";

                        if (isCenter) {
                            xPos = "0%";
                            scale = 1.1;
                            zIndex = 20;
                            opacity = 1;
                            rotateY = "0deg";
                        } else if (isLeft) {
                            xPos = "-55%";
                            scale = 0.85;
                            zIndex = 10;
                            opacity = 0.6;
                            rotateY = "15deg";
                        } else { // Right
                            xPos = "55%";
                            scale = 0.85;
                            zIndex = 10;
                            opacity = 0.6;
                            rotateY = "-15deg";
                        }

                        return (
                            <motion.div
                                key={item.id}
                                layoutId={item.id}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{
                                    x: xPos,
                                    scale,
                                    zIndex,
                                    opacity,
                                    rotateY,
                                }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                }}
                                drag={isCenter ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={handleDragEnd}
                                className={cn(
                                    "absolute w-24 h-32 rounded-xl flex flex-col items-center justify-center p-1.5 shadow-2xl backdrop-blur-md transition-shadow duration-300 select-none overflow-hidden",
                                    isCenter
                                        ? "bg-gradient-to-b from-cyan-950/90 to-black/80 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                                        : "bg-black/60 border border-white/10 grayscale hover:grayscale-0 cursor-pointer"
                                )}
                                onClick={() => {
                                    if (!isCenter) {
                                        if (item.position === "left") handlePrev();
                                        else handleNext();
                                    }
                                }}
                            >
                                {/* Image or Icon */}
                                <div className={cn(
                                    "relative w-full aspect-square rounded-lg flex items-center justify-center overflow-hidden mb-2 bg-black/40 border transition-all",
                                    isCenter ? "border-cyan-500/30" : "border-white/5"
                                )}>
                                    <CarouselImage item={item} type={type} isCenter={isCenter} />
                                </div>

                                <span className={cn(
                                    "text-[9px] font-mono text-center truncate w-full px-1",
                                    isCenter ? "text-cyan-300 font-bold tracking-wider" : "text-muted-foreground"
                                )}>
                                    {item.label}
                                </span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div >
    );
}

// Sub-component to handle image error state independently
const CarouselImage = ({ item, type, isCenter }: { item: CarouselItem, type: string, isCenter: boolean }) => {
    const [hasError, setHasError] = React.useState(false);

    if (item.image && !hasError) {
        return (
            <img
                src={item.image}
                alt={item.label}
                className="w-full h-full object-cover"
                draggable={false}
                onError={() => setHasError(true)}
            />
        );
    }

    return (
        <div className={cn(
            "size-full flex items-center justify-center",
            isCenter ? "text-cyan-400" : "text-cyan-800"
        )}>
            {item.icon ? item.icon : (type === "model" ? <User className="size-8" /> : <FileVideo className="size-8" />)}
        </div>
    );
};
