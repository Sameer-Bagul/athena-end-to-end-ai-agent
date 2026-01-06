import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Cpu, Mic } from "lucide-react";

interface WelcomeProps {
    onNext: () => void;
}

export function Welcome({ onNext }: WelcomeProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="w-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-3">Welcome to Athena</h2>
                <p className="text-lg text-white/60 leading-relaxed max-w-sm mx-auto">
                    A new way to think, organize, and create with your own 3D AI companion.
                </p>
            </div>

            {/* Features (Reassurance) */}
            <div className="grid gap-4 mb-8">
                <FeatureItem
                    icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
                    title="Private & Secure"
                    desc="Processed locally on your device."
                />
                <FeatureItem
                    icon={<Cpu className="w-5 h-5 text-purple-400" />}
                    title="AI Powered"
                    desc="Voice, gestures, and intelligence."
                />
                <FeatureItem
                    icon={<Mic className="w-5 h-5 text-cyan-400" />}
                    title="Voice Control"
                    desc="Hands-free interaction anytime."
                />
            </div>

            {/* Actions */}
            <div className="space-y-4">
                <button
                    onClick={onNext}
                    className="w-full group bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-medium py-4 px-6 rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                >
                    Get Started
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-center text-xs text-white/30">
                    By continuing, you agree to run AI models on your local hardware.
                </p>
            </div>
        </motion.div>
    );
}

function FeatureItem({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
            <div className="mt-1">{icon}</div>
            <div>
                <h3 className="text-sm font-semibold text-white/90">{title}</h3>
                <p className="text-xs text-white/50">{desc}</p>
            </div>
        </div>
    );
}
