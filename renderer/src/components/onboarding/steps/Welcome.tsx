import { ArrowRight, ShieldCheck, Cpu, Mic } from "lucide-react";

interface WelcomeProps {
    onNext: () => void;
}

export function Welcome({ onNext }: WelcomeProps) {
    return (
        <div className="w-[90vw] max-w-2xl bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden text-center">
            {/* Logo/Icon Placeholder or Glow */}
            <div className="relative mb-12">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/[0.03] blur-[40px] rounded-full" />
                <div className="relative inline-flex items-center justify-center size-20 rounded-[2rem] bg-white/[0.02] border border-white/10">
                    <ShieldCheck className="size-8 text-white/60" />
                </div>
            </div>

            <div className="mb-12">
                <h2 className="text-4xl font-medium tracking-tight text-white mb-4">Athena</h2>
                <p className="text-white/30 text-base max-w-sm mx-auto leading-relaxed">
                    A decentralized, on-device intelligence designed to extend your cognitive capabilities with complete privacy.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-2 mb-12 max-w-md mx-auto text-left">
                <FeatureItem
                    icon={<Cpu className="size-4" />}
                    title="Local Execution"
                    desc="Core models run entirely on your hardware."
                />
                <FeatureItem
                    icon={<Mic className="size-4" />}
                    title="Neural Interaction"
                    desc="Voice and presence-aware assistance."
                />
            </div>

            <div className="flex flex-col items-center gap-6">
                <button
                    onClick={onNext}
                    className="group relative flex items-center gap-3 px-12 py-4 bg-white text-black rounded-full font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5"
                >
                    Begin Initialization
                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-[10px] text-white/10 uppercase tracking-[0.2em]">Version 1.0.0 Alpha</p>
            </div>
        </div>
    );
}

function FeatureItem({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="flex items-center gap-5 p-4 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all group">
            <div className="size-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/20 group-hover:text-white/40 transition-colors">
                {icon}
            </div>
            <div>
                <h3 className="text-[13px] font-medium text-white/80">{title}</h3>
                <p className="text-xs text-white/20">{desc}</p>
            </div>
        </div>
    );
}
