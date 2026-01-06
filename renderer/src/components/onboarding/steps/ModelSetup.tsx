import { motion } from "framer-motion";
import { BrainCircuit, Settings2 } from "lucide-react";

interface ModelSetupProps {
    onNext: () => void;
}

export function ModelSetup({ onNext }: ModelSetupProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">AI Intelligence</h2>
                <p className="text-sm text-white/60">
                    Select the brain that powers Athena.
                </p>
            </div>

            <div className="grid gap-4 mb-8">
                {/* Recommended */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3 mb-2">
                        <BrainCircuit className="w-6 h-6 text-cyan-400" />
                        <span className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Recommended</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Standard Local Model</h3>
                    <p className="text-sm text-white/60 mb-4">
                        Fast, private, and runs entirely on your device. Zero data sharing.
                    </p>
                    <button
                        onClick={onNext}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Use Standard
                    </button>
                </div>

                {/* Custom */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 transition-all opacity-80 hover:opacity-100">
                    <div className="flex items-center gap-3 mb-2">
                        <Settings2 className="w-5 h-5 text-white/40" />
                        <span className="text-sm font-bold text-white/40 uppercase tracking-wider">Advanced</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-white font-medium">Custom / API</h3>
                            <p className="text-xs text-white/40">Ollama, OpenAI, DeepSeek...</p>
                        </div>
                        <button
                            onClick={onNext}
                            className="text-xs text-white/60 hover:text-white underline decoration-white/30"
                        >
                            Configure later
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
