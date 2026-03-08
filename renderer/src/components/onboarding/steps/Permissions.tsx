import { Mic, Camera, Check, ChevronRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "../../../lib/utils";

interface PermissionsProps {
    onNext: () => void;
}

export function Permissions({ onNext }: PermissionsProps) {
    const [micEnabled, setMicEnabled] = useState(false);
    const [camEnabled, setCamEnabled] = useState(false);

    const toggleMic = () => setMicEnabled(!micEnabled);
    const toggleCam = () => setCamEnabled(!camEnabled);

    return (
        <div className="w-[90vw] max-w-2xl bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
            <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-white/5 border border-white/10 mb-6 text-white/40">
                    <ShieldCheck className="size-7" />
                </div>
                <h2 className="text-3xl font-medium tracking-tight text-white mb-3">System Access</h2>
                <p className="text-white/30 text-sm max-w-md mx-auto leading-relaxed">
                    Athena requires hardware access for sensing and interaction. All data remains strictly isolated on your device.
                </p>
            </div>

            <div className="space-y-3 mb-12">
                {/* Microphone */}
                <div
                    onClick={toggleMic}
                    className={cn(
                        "group cursor-pointer p-6 rounded-[2rem] border transition-all duration-500 flex items-center justify-between",
                        micEnabled
                            ? 'bg-white/[0.04] border-white/10'
                            : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03]'
                    )}
                >
                    <div className="flex items-center gap-5">
                        <div className={cn(
                            "size-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                            micEnabled ? 'bg-white/10 text-white' : 'bg-white/[0.03] text-white/20'
                        )}>
                            <Mic className="size-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-white/90">Microphone</h3>
                            <p className="text-[11px] text-white/30">Core interaction and voice commands.</p>
                        </div>
                    </div>
                    <div className={cn(
                        "size-6 rounded-full border flex items-center justify-center transition-all duration-500",
                        micEnabled ? 'bg-white border-white' : 'bg-transparent border-white/10'
                    )}>
                        {micEnabled && <Check className="size-3.5 text-black" />}
                    </div>
                </div>

                {/* Camera */}
                <div
                    onClick={toggleCam}
                    className={cn(
                        "group cursor-pointer p-6 rounded-[2rem] border transition-all duration-500 flex items-center justify-between",
                        camEnabled
                            ? 'bg-white/[0.04] border-white/10'
                            : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03]'
                    )}
                >
                    <div className="flex items-center gap-5">
                        <div className={cn(
                            "size-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                            camEnabled ? 'bg-white/10 text-white' : 'bg-white/[0.03] text-white/20'
                        )}>
                            <Camera className="size-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-white/90">Visual Gaze (Optional)</h3>
                            <p className="text-[11px] text-white/30">Enables dynamic eye contact tracking.</p>
                        </div>
                    </div>
                    <div className={cn(
                        "size-6 rounded-full border flex items-center justify-center transition-all duration-500",
                        camEnabled ? 'bg-white border-white' : 'bg-transparent border-white/10'
                    )}>
                        {camEnabled && <Check className="size-3.5 text-black" />}
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-6">
                <button
                    onClick={onNext}
                    className="w-full group relative flex items-center justify-center gap-3 px-12 py-4 bg-white text-black rounded-full font-bold text-sm hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-white/5"
                >
                    Grant Access
                    <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                    onClick={onNext}
                    className="text-[10px] font-bold text-white/10 hover:text-white/40 uppercase tracking-[0.3em] transition-colors"
                >
                    Configure Later
                </button>
            </div>
        </div>
    );
}
