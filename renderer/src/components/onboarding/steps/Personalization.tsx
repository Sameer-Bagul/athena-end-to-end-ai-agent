import { motion } from "framer-motion";
import { User, Sparkles } from "lucide-react";
import { useState } from "react";

interface PersonalizationProps {
    onNext: (name: string) => void;
}

const USE_CASES = [
    "Productivity", "Coding", "Learning", "Companion", "Creative"
];

export function Personalization({ onNext }: PersonalizationProps) {
    const [name, setName] = useState("");
    const [useCase, setUseCase] = useState(USE_CASES[0]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 mb-4">
                    <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Make it Yours</h2>
                <p className="text-sm text-white/60">
                    Last step. Let's make introductions.
                </p>
            </div>

            <div className="space-y-6 mb-8">
                {/* Name Input */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider pl-1">
                        What should I call you?
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 rounded-xl px-4 py-3 pl-10 text-white placeholder-white/20 outline-none transition-all"
                        />
                        <User className="w-5 h-5 text-white/30 absolute left-3 top-3.5" />
                    </div>
                </div>

                {/* Use Case */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider pl-1">
                        Primary Goal
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {USE_CASES.map(uc => (
                            <button
                                key={uc}
                                onClick={() => setUseCase(uc)}
                                className={`text-sm py-2 px-3 rounded-lg border transition-all
                            ${useCase === uc
                                        ? 'bg-purple-500/20 border-purple-500/40 text-white'
                                        : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'
                                    }`}
                            >
                                {uc}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={() => onNext(name)}
                disabled={!name.trim()}
                className="w-full bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                Finish Setup
            </button>
        </motion.div>
    );
}
