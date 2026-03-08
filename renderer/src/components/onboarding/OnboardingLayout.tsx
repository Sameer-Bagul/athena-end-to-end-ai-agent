import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface OnboardingLayoutProps {
    children: ReactNode;
}

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
    return (
        <div className="relative w-full h-full overflow-hidden bg-[#050505] text-white selection:bg-white/10">
            {/* 🌌 Minimalist Background Layer */}
            <div className="absolute inset-0 z-0">
                {/* Clean Dark Gradient */}
                <div className="absolute inset-0 bg-black" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)] opacity-50" />

                {/* Subtle Glow at top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-white/[0.02] blur-[120px] rounded-full" />
            </div>

            {/* 🔮 Content Layer */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full flex items-center justify-center"
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
}
