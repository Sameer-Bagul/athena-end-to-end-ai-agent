import { User, Sparkles, MessageSquareQuote } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "../../../context/AppContext";

interface PersonalizationProps {
    onNext: () => void;
}

export function Personalization({ onNext }: PersonalizationProps) {
    const { state, actions } = useAppStore();
    const [name, setName] = useState(state.userProfile.name || "");
    const [bio, setBio] = useState(state.userProfile.bio || "");

    const handleFinish = () => {
        actions.setUserProfile({ name, bio });
        onNext();
    };

    return (
        <div className="w-[90vw] max-w-2xl bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-white/5 border border-white/10 mb-6 text-white/40">
                    <Sparkles className="size-7" />
                </div>
                <h2 className="text-3xl font-medium tracking-tight text-white mb-3">Identity Synthesis</h2>
                <p className="text-white/30 text-sm max-w-md mx-auto leading-relaxed">
                    Personalize how Athena perceives and interacts with you. This context allows for highly specific neural responses.
                </p>
            </div>

            <div className="space-y-8 mb-12">
                {/* Name Input */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] pl-1">
                        Display Name
                    </label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/10 group-focus-within:text-white/40 transition-colors" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="How should Athena address you?"
                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-white/20 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Bio Input */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] pl-1">
                        Professional Context
                    </label>
                    <div className="relative group">
                        <MessageSquareQuote className="absolute left-4 top-5 size-4 text-white/10 group-focus-within:text-white/40 transition-colors" />
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="e.g. Researcher exploring cognitive architectures..."
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-white/20 transition-all font-medium resize-none leading-relaxed"
                        />
                    </div>
                    <p className="text-[10px] text-white/10 mt-2 px-1">
                        This information is stored locally and used only for internal reasoning.
                    </p>
                </div>
            </div>

            <button
                onClick={handleFinish}
                disabled={!name.trim()}
                className="w-full group relative flex items-center justify-center gap-3 px-12 py-4 bg-white text-black rounded-full font-bold text-sm hover:scale-[1.01] active:scale-[0.99] disabled:opacity-20 disabled:scale-100 disabled:cursor-not-allowed transition-all shadow-xl shadow-white/5"
            >
                Initialize Core
                <Sparkles className="size-4 opacity-40 group-hover:scale-110 transition-transform" />
            </button>
        </div>
    );
}
