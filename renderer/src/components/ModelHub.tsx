import * as React from "react";
import { motion } from "framer-motion";
import { Download, Trash2, CheckCircle2, Loader2, Info, Cpu, HardDrive, Brain, Mic2, Volume2, RotateCcw } from "lucide-react";
import { cn } from "../lib/utils";
import { useAppStore } from "../context/AppContext";
import { aiModuleManager, type AIModelInfo } from "../services/ai/aiModuleManager";

export function ModelHub() {
    const { state, actions } = useAppStore();
    const [availableModels, setAvailableModels] = React.useState<(AIModelInfo & { isInstalled: boolean })[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [ollamaRunning, setOllamaRunning] = React.useState(false);

    const refresh = React.useCallback(async () => {
        setIsLoading(true);
        const running = await aiModuleManager.checkOllamaStatus();
        setOllamaRunning(running);

        const available = await aiModuleManager.getAllRecommended();
        setAvailableModels(available);

        setIsLoading(false);
    }, []);

    React.useEffect(() => {
        refresh();
        const interval = setInterval(() => {
            if (Object.keys(state.downloadingModels).length > 0) {
                // Skip full refresh if busy pulling
            } else {
                refresh();
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [refresh, state.downloadingModels]);

    const categories = [
        { id: 'brain', label: 'Conceptual Brain', icon: Brain, description: 'Core LLM models for reasoning and tool use.' },
        { id: 'intelligence', label: 'Intelligence / STT', icon: Mic2, description: 'Sensing and transcription models (Whisper).' },
        { id: 'presence', label: 'Presence / TTS', icon: Volume2, description: 'Vocal and expressive generation models.' },
    ];

    if (isLoading && availableModels.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-white/20">
                <Loader2 className="size-8 animate-spin mb-4" />
                <span className="text-[10px] uppercase tracking-widest font-bold">Initializing Hub...</span>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-12">
            {!ollamaRunning && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-4">
                    <Info className="size-5 text-red-400" />
                    <div>
                        <p className="text-xs text-white/80 font-bold">Ollama Offline</p>
                        <p className="text-[10px] text-white/40">The Conceptual Brain category requires Ollama to be running.</p>
                    </div>
                </div>
            )}

            {categories.map((cat) => {
                const models = availableModels.filter(m => m.category === cat.id);
                if (models.length === 0) return null;

                return (
                    <section key={cat.id} className="space-y-6">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                            <div className="p-2 rounded-lg bg-white/5 text-purple-400">
                                <cat.icon className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{cat.label}</h3>
                                <p className="text-[10px] text-white/40">{cat.description}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {models.map((model) => {
                                const downloadInfo = state.downloadingModels[model.name];
                                const isDownloading = !!downloadInfo;
                                const progress = downloadInfo?.progress || 0;
                                const statusText = downloadInfo?.status || "Syncing...";

                                return (
                                    <motion.div
                                        layout
                                        key={model.id}
                                        className={cn(
                                            "group relative p-5 rounded-2xl border transition-all duration-500",
                                            model.isInstalled
                                                ? "bg-green-500/[0.02] border-green-500/20 hover:border-green-500/40"
                                                : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex gap-2 mb-4">
                                            <span className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-bold text-white/40 uppercase tracking-tight flex items-center gap-1">
                                                <Cpu className="size-2.5" /> {model.params}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-bold text-white/40 uppercase tracking-tight flex items-center gap-1">
                                                <HardDrive className="size-2.5" /> {model.size}
                                            </span>
                                            {model.isInstalled && (
                                                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-[8px] font-bold text-green-400 uppercase tracking-tight">
                                                    Installed
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-sm font-bold text-white mb-1">{model.label}</h3>
                                        <p className="text-[11px] text-white/40 line-clamp-2 mb-6 group-hover:text-white/60 transition-colors">
                                            {model.description}
                                        </p>

                                        <div className="flex items-center justify-between gap-4">
                                            {isDownloading ? (
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex justify-between text-[8px] text-white/30 uppercase tracking-widest font-bold">
                                                        <span className="truncate max-w-[120px]">{statusText}</span>
                                                        <span>{progress}%</span>
                                                    </div>
                                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-purple-500"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : model.isInstalled ? (
                                                <div className="flex items-center gap-2 text-green-400">
                                                    <CheckCircle2 className="size-4" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Active</span>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        actions.startModelPull(model);
                                                    }}
                                                    disabled={model.category === 'brain' && !ollamaRunning}
                                                    className={cn(
                                                        "h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-lg",
                                                        model.category === 'brain' && !ollamaRunning
                                                            ? "bg-white/5 text-white/20 cursor-not-allowed"
                                                            : "bg-white text-black hover:bg-white/90 shadow-white/5"
                                                    )}
                                                >
                                                    <Download className="size-3.5" /> Initialize
                                                </button>
                                            )}

                                            {model.isInstalled && (
                                                <button
                                                    className="size-9 flex items-center justify-center rounded-xl bg-white/5 text-white/20 hover:bg-red-500/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                                    title="Uninstall"
                                                    onClick={async () => {
                                                        if (confirm(`Uninstall ${model.label}? This will remove all local model files.`)) {
                                                            const success = await aiModuleManager.uninstallModel(model);
                                                            if (success) {
                                                                refresh();
                                                            } else {
                                                                alert("Failed to uninstall model. It might be in use.");
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
            {/* Advanced Section */}
            <section className="pt-8 border-t border-white/5 opacity-50 hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">System Maintenance</h4>
                        <p className="text-[9px] text-white/20">Restart the onboarding process to re-configure identity and core modules.</p>
                    </div>
                    <button
                        onClick={() => {
                            if (confirm("Reset system setup? This will return you to the onboarding flow.")) {
                                localStorage.removeItem("athena_onboarding_complete");
                                window.location.reload();
                            }
                        }}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 border border-red-500/10 transition-all"
                    >
                        <RotateCcw className="size-3" /> Reset Setup
                    </button>
                </div>
            </section>
        </div>
    );
}
