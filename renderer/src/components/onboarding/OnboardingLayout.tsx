import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface OnboardingLayoutProps {
    children: ReactNode;
}

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
    return (
        <div className="relative w-full h-full overflow-hidden bg-[#0a0a16] text-white selection:bg-cyan-500/30">
            {/* 🌌 Space Background Layer */}
            <div className="absolute inset-0 z-0">
                {/* Deep Space Gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a3a] via-[#0a0a16] to-[#000000]" />

                {/* Nebula Glows */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/10 blur-[100px] rounded-full mix-blend-screen" />

                {/* Stars (Simple CSS) */}
                <div className="absolute inset-0 opacity-30"
                    style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
                </div>
            </div>

            {/* 🔮 Content Layer */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-xl"
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
}
