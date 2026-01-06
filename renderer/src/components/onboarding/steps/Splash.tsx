import { motion } from "framer-motion";

export function Splash() {
    return (
        <div className="flex flex-col items-center justify-center space-y-8 min-h-[50vh]">
            {/* Logo Animation */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative"
            >
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 blur-xl absolute inset-0 opacity-50 animate-pulse" />
                <div className="w-24 h-24 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center relative z-10 shadow-2xl">
                    <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                        A
                    </span>
                </div>
            </motion.div>

            {/* Tagline */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-center"
            >
                <h1 className="text-2xl font-light tracking-wide text-white/90 mb-2">
                    Athena
                </h1>
                <p className="text-sm text-cyan-200/60 tracking-widest uppercase">
                    Your Personal AI Companion
                </p>
                <p className="text-xs text-white/30 mt-4">
                    Private • Local • Always Here
                </p>
            </motion.div>
        </div>
    );
}

