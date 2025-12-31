import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, User, FileVideo } from "lucide-react";
import { cn } from "../../lib/utils";

interface CarouselItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
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

    // Sync internal state if prop changes externally
    React.useEffect(() => {
        const idx = items.findIndex((item) => item.id === selectedId);
        if (idx >= 0 && idx !== activeIndex) {
            setActiveIndex(idx);
        }
    }, [selectedId, items]);

    const handleNext = () => {
        const nextIndex = (activeIndex + 1) % items.length;
        setActiveIndex(nextIndex);
        onSelect(items[nextIndex].id);
    };

    const handlePrev = () => {
        const prevIndex = (activeIndex - 1 + items.length) % items.length;
        setActiveIndex(prevIndex);
        onSelect(items[prevIndex].id);
    };

    // Calculate visible items: [prev, current, next]
    // We handle wrapping manually to create the illusion of infinite scroll
    const getVisibleItems = () => {
        const len = items.length;
        if (len === 0) return [];

        // Previous Item
        const prevIndex = (activeIndex - 1 + len) % len;
        // Next Item
        const nextIndex = (activeIndex + 1) % len;

        return [
            { ...items[prevIndex], position: "left", index: prevIndex },
            { ...items[activeIndex], position: "center", index: activeIndex },
            { ...items[nextIndex], position: "right", index: nextIndex },
        ];
    };

    const visibleItems = getVisibleItems();

    return (
        <div className="relative w-full h-48 flex items-center justify-center perspective-1000">

            {/* Navigation Areas (Invisible click zones for easier interaction) */}
            <div className="absolute left-0 top-0 h-full w-1/4 z-20 cursor-pointer hover:bg-cyan-500/5 transition-colors" onClick={handlePrev} />
            <div className="absolute right-0 top-0 h-full w-1/4 z-20 cursor-pointer hover:bg-cyan-500/5 transition-colors" onClick={handleNext} />

            {/* Controls (Visual) */}
            <button
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-2 z-30 p-1 rounded-full bg-cyan-950/50 text-cyan-500 hover:bg-cyan-500 hover:text-black transition-all border border-cyan-500/30"
            >
                <ChevronLeft className="size-4" />
            </button>

            <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-2 z-30 p-1 rounded-full bg-cyan-950/50 text-cyan-500 hover:bg-cyan-500 hover:text-black transition-all border border-cyan-500/30"
            >
                <ChevronRight className="size-4" />
            </button>


            {/* 3D Cards Container */}
            <div className="relative w-full h-full flex items-center justify-center">
                <AnimatePresence mode="popLayout">
                    {visibleItems.map((item) => {
                        const isCenter = item.position === "center";
                        const isLeft = item.position === "left";
                        // const isRight = item.position === "right";

                        // 3D Transforms
                        let x = "0%";
                        let scale = 1;
                        let zIndex = 10;
                        let opacity = 1;
                        let rotateY = "0deg";

                        if (isCenter) {
                            x = "0%";
                            scale = 1.1;
                            zIndex = 20;
                            opacity = 1;
                            rotateY = "0deg";
                        } else if (isLeft) {
                            x = "-60%";
                            scale = 0.8;
                            zIndex = 10;
                            opacity = 0.5;
                            rotateY = "25deg";
                        } else { // Right
                            x = "60%";
                            scale = 0.8;
                            zIndex = 10;
                            opacity = 0.5;
                            rotateY = "-25deg";
                        }

                        return (
                            <motion.div
                                key={item.id} // Use ID to allow Framer Motion to track identity, but for infinite loop with duplicates we might need index+id if strictly unique, but here distinct IDs usually work if list is > 3
                                layoutId={item.id}
                                initial={false}
                                animate={{
                                    x,
                                    scale,
                                    zIndex,
                                    opacity,
                                    rotateY,
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                }}
                                className={cn(
                                    "absolute w-24 h-32 rounded-xl border-2 flex flex-col items-center justify-center gap-2 p-2 shadow-xl backdrop-blur-md transition-shadow duration-300",
                                    isCenter
                                        ? "bg-cyan-950/80 border-cyan-400 shadow-[0_0_20px_var(--color-cyan-500)]"
                                        : "bg-black/60 border-cyan-900/50 grayscale hover:grayscale-0 cursor-pointer"
                                )}
                                onClick={() => {
                                    if (!isCenter) {
                                        onSelect(item.id);
                                    }
                                }}
                            >
                                <div className={cn(
                                    "size-12 rounded-full flex items-center justify-center bg-cyan-950 border transition-all",
                                    isCenter ? "border-cyan-400 bg-cyan-900 animate-pulse-slow" : "border-cyan-900/50"
                                )}>
                                    {type === "model" ? (
                                        <User className={cn("size-6", isCenter ? "text-cyan-300" : "text-cyan-700")} />
                                    ) : (
                                        <FileVideo className={cn("size-6", isCenter ? "text-cyan-300" : "text-cyan-700")} />
                                    )}
                                </div>

                                <span className={cn(
                                    "text-[10px] font-mono text-center truncate w-full px-1",
                                    isCenter ? "text-cyan-300 font-bold tracking-wider" : "text-cyan-800"
                                )}>
                                    {item.label}
                                </span>

                                {isCenter && (
                                    <div className="absolute -bottom-6 text-[9px] text-cyan-500 font-mono tracking-[0.2em] uppercase animate-pulse">
                                        Selected
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

        </div>
    );
}
