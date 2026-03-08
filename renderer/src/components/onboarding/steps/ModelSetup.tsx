import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Mic2, Volume2, CheckCircle2, AlertCircle, Loader2, Cpu, HardDrive } from "lucide-react";
import { useAppStore } from "../../../context/AppContext";
import { aiModuleManager, type AIModelInfo } from "../../../services/ai/aiModuleManager";
import { cn } from "../../../lib/utils";

interface ModelSetupProps {
    onNext: () => void;
    onBack: () => void;
}

export function ModelSetup({ onNext, onBack }: ModelSetupProps) {
    const { state, actions } = useAppStore();
    const [status, setStatus] = useState<'checking' | 'ollama_missing' | 'model_selection'>('checking');
    const [availableAI, setAvailableAI] = useState<(AIModelInfo & { isInstalled: boolean })[]>([]);

    const checkOllama = async () => {
        const isRunning = await aiModuleManager.checkOllamaStatus();
        if (!isRunning) {
            setStatus('ollama_missing');
            return;
        }

        const models = await aiModuleManager.getAllRecommended();
        setAvailableAI(models);
        setStatus('model_selection');
    };

    useEffect(() => {
        checkOllama();
        const interval = setInterval(() => {
            if (Object.keys(state.downloadingModels).length === 0) {
                checkOllama();
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [state.downloadingModels]);

    const categories = [
        { id: 'brain', label: 'Conceptual Brain', icon: BrainCircuit, color: 'text-white/80' },
        { id: 'intelligence', label: 'Sensing', icon: Mic2, color: 'text-white/60' },
        { id: 'presence', label: 'Presence', icon: Volume2, color: 'text-white/40' },
    ];

    const isAllReady = availableAI.length > 0 && availableAI.every((m: AIModelInfo & { isInstalled: boolean }) => m.isInstalled || m.category !== 'brain');

    if (status === 'checking') {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-white/10 min-h-[400px]">
                <Loader2 className="size-8 animate-spin mb-6" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Detecting AI Environment</span>
            </div>
        );
    }

    return (
        <div className="w-[90vw] max-w-5xl bg-[#0a0a0a]/60 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Module Setup</span>
                    <div className="h-px flex-1 bg-white/5" />
                </div>
                <h2 className="text-4xl font-medium tracking-tight text-white mb-4">Initialize Intelligence</h2>
                <p className="text-white/30 text-sm max-w-xl leading-relaxed">
                    Athena is an on-device first assistant. Synchronize her core cognitive modules to enable local execution without external dependencies.
                </p>
            </div>

            <div className="grid gap-8 mb-16">
                {status === 'ollama_missing' ? (
                    <div className="p-10 rounded-3xl bg-white/[0.02] border border-white/5 text-center">
                        <AlertCircle className="size-10 text-white/20 mx-auto mb-6" />
                        <h3 className="text-xl font-medium text-white mb-3">Ollama Connection Required</h3>
                        <p className="text-sm text-white/30 mb-8 max-w-md mx-auto leading-relaxed">
                            The Conceptual Brain requires <b>Ollama</b> to be active. Please ensure it is running on your system.
                        </p>
                        <button
                            onClick={checkOllama}
                            className="px-10 py-3.5 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Reconnect
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {categories.map(cat => (
                            <div key={cat.id} className="space-y-6">
                                <div className="flex items-center gap-3 px-1">
                                    <cat.icon className={cn("size-3.5", cat.color)} />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{cat.label}</span>
                                </div>

                                <div className="space-y-3">
                                    {availableAI.filter(m => m.category === cat.id).map(model => {
                                        const downloadInfo = state.downloadingModels[model.name];
                                        const isBusy = !!downloadInfo;
                                        const progress = downloadInfo?.progress || 0;
                                        const statusText = downloadInfo?.status || "Syncing";

                                        return (
                                            <div
                                                key={model.id}
                                                className={cn(
                                                    "group p-5 rounded-2xl border transition-all duration-500",
                                                    model.isInstalled
                                                        ? "bg-white/[0.03] border-white/10"
                                                        : "bg-white/[0.01] border-white/5 hover:bg-white/[0.02] hover:border-white/10"
                                                )}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-[13px] font-medium text-white mb-1.5">{model.label}</h4>
                                                        <div className="flex gap-3">
                                                            <span className="text-[9px] text-white/20 flex items-center gap-1.5 font-medium uppercase tracking-wider">
                                                                <Cpu className="size-2.5 opacity-50" /> {model.params}
                                                            </span>
                                                            <span className="text-[9px] text-white/20 flex items-center gap-1.5 font-medium uppercase tracking-wider">
                                                                <HardDrive className="size-2.5 opacity-50" /> {model.size}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {isBusy ? (
                                                    <div className="mt-5 space-y-2.5">
                                                        <div className="flex justify-between text-[9px] font-bold text-white/40 uppercase tracking-widest">
                                                            <span className="animate-pulse truncate max-w-[120px]">{statusText}</span>
                                                            <span>{progress}%</span>
                                                        </div>
                                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                className="h-full bg-white/80"
                                                                animate={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : model.isInstalled ? (
                                                    <div className="mt-5 flex items-center gap-2 text-white/40">
                                                        <CheckCircle2 className="size-3.5 opacity-40" />
                                                        <span className="text-[9px] font-bold uppercase tracking-widest">Active</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => actions.startModelPull(model)}
                                                        className="mt-5 w-full py-2.5 bg-white text-black rounded-xl text-[10px] font-bold uppercase tracking-[0.1em] transition-all hover:bg-neutral-200 active:scale-[0.98]"
                                                    >
                                                        Initialize
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-white/5">
                <button
                    onClick={onBack}
                    className="text-[10px] font-bold text-white/20 hover:text-white/60 transition-colors uppercase tracking-[0.2em]"
                >
                    Previous Step
                </button>

                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex items-center gap-2 text-[10px] text-white/20 font-bold uppercase tracking-widest">
                        <div className={cn("size-1.5 rounded-full", isAllReady ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-white/5")} />
                        {isAllReady ? "Status: Operational" : "Status: Configuration Required"}
                    </div>

                    <button
                        onClick={onNext}
                        className={cn(
                            "px-10 py-4 rounded-full font-bold uppercase tracking-widest transition-all text-xs",
                            isAllReady
                                ? "bg-white text-black hover:scale-[1.02] active:scale-[0.98] shadow-xl"
                                : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                        )}
                    >
                        Proceed to Cloud
                    </button>
                </div>
            </div>
        </div>
    );
}
