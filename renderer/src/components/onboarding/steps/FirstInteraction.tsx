import { motion } from "framer-motion";
import { useEffect } from "react";
import { useAppStore } from "../../../context/AppContext";

interface FirstInteractionProps {
    onComplete: () => void;
}

export function FirstInteraction({ onComplete }: FirstInteractionProps) {
    const { state } = useAppStore();

    useEffect(() => {
        // Simulate "Waking up" delay
        const timer = setTimeout(() => {
            onComplete();
        }, 4000); // 4 seconds total
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="mb-8"
            >
                <div className="w-32 h-32 relative">
                    <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-2xl animate-pulse" />
                    <div className="absolute inset-4 bg-white/10 rounded-full border border-white/20 backdrop-blur-md" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                    </div>
                </div>
            </motion.div>

            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="text-3xl font-light text-white mb-2"
            >
                Hello, <span className="font-bold text-cyan-300">{state.userProfile.name || "User"}</span>.
            </motion.h2>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="text-white/40 text-[10px] uppercase font-bold tracking-[0.3em]"
            >
                Neural Synthesis Complete.
            </motion.p>
        </div>
    );
}
