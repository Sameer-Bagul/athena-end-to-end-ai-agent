import { motion } from "framer-motion";
import { Mic, MessageSquare, Shield } from "lucide-react";

interface DashboardIntroProps {
    onNext: () => void;
}

export function DashboardIntro({ onNext }: DashboardIntroProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-2xl text-center"
        >
            <h2 className="text-3xl font-bold text-white mb-8">You're all set.</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <TourCard
                    icon={<Mic className="w-6 h-6 text-cyan-400" />}
                    title="Speak Freely"
                    desc="Press 'Space' or click the mic to talk."
                />
                <TourCard
                    icon={<MessageSquare className="w-6 h-6 text-purple-400" />}
                    title="Interrupt"
                    desc="Athena listens. Talk over her anytime."
                />
                <TourCard
                    icon={<Shield className="w-6 h-6 text-emerald-400" />}
                    title="Privacy"
                    desc="Your data stays on your machine."
                />
            </div>

            <button
                onClick={onNext}
                className="px-10 py-4 bg-white text-black text-lg font-bold rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
                Enter Athena
            </button>
        </motion.div>
    );
}

function TourCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 transition-colors">
            <div className="mb-4 bg-white/5 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                {icon}
            </div>
            <h3 className="font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-white/50">{desc}</p>
        </div>
    );
}
