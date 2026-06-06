import { motion } from "framer-motion";
import { Cloud, Key, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import * as React from "react";
import { useAppStore } from "../../../context/AppContext";

interface CloudRegistryProps {
    onNext: () => void;
    onBack: () => void;
}

export function CloudRegistry({ onNext, onBack }: CloudRegistryProps) {
    const state = useAppStore(s => s.state);
    const actions = useAppStore(s => s.actions);
    const [geminiKey, setGeminiKey] = React.useState(state.aiConfig.gemini[0]?.apiKey || "");
    const [isSaved, setIsSaved] = React.useState(false);

    const handleSave = () => {
        const newConfig = { ...state.aiConfig };
        if (!newConfig.gemini) newConfig.gemini = [{ apiKey: "", model: "gemini-pro" }];
        newConfig.gemini[0].apiKey = geminiKey;
        actions.setAiConfig(newConfig);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="w-[90vw] max-w-2xl bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-white/5 border border-white/10 mb-6">
                    <Cloud className="size-7 text-white/80" />
                </div>
                <h2 className="text-3xl font-medium tracking-tight text-white mb-3">Cloud Registry</h2>
                <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed">
                    Optionally connect cloud providers to enhance Athena's capabilities beyond local execution.
                </p>
            </div>

            {/* Gemini Section */}
            <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.04]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/10">
                            <ShieldCheck className="size-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-medium text-white/90">Google Gemini</h3>
                            <p className="text-xs text-white/30">Free tier available. Supports high-speed reasoning.</p>
                        </div>
                    </div>

                    <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/20 group-focus-within:text-white/40 transition-colors" />
                        <input
                            type="password"
                            placeholder="Enter Gemini API Key (Optional)"
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            onBlur={handleSave}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-white/20 transition-all font-mono"
                        />
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="mt-12 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="text-xs font-medium text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    className="group relative flex items-center gap-3 px-8 py-3.5 bg-white text-black rounded-full font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    {isSaved ? "Saved" : "Continue"}
                    <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>

            {/* Success Notification */}
            {isSaved && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full pointer-events-none"
                >
                    <CheckCircle2 className="size-3.5 text-green-400" />
                    <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Configuration Updated</span>
                </motion.div>
            )}
        </div>
    );
}
