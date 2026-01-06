import { motion } from "framer-motion";
import { Volume2, Play, Circle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface VoiceSetupProps {
    onNext: () => void;
}

const VOICES = [
    { id: 'en-US-JennyNeural', name: 'Athena (Default)', desc: 'Warm, Professional' },
    { id: 'en-US-GuyNeural', name: 'Atlas', desc: 'Deep, Calm' },
    { id: 'en-US-AriaNeural', name: 'Luna', desc: 'Energetic, Friendly' },
];

export function VoiceSetup({ onNext }: VoiceSetupProps) {
    const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 mb-4">
                    <Volume2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Choose a Voice</h2>
                <p className="text-sm text-white/60">
                    How should Athena sound to you?
                </p>
            </div>

            <div className="space-y-3 mb-8">
                {VOICES.map((voice) => (
                    <div
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice.id)}
                        className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 flex items-center justify-between
              ${selectedVoice === voice.id
                                ? 'bg-cyan-500/10 border-cyan-500/40'
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                                <Play className="w-3 h-3 text-white fill-white" />
                            </button>
                            <div>
                                <h3 className={`font-medium ${selectedVoice === voice.id ? 'text-cyan-400' : 'text-white'}`}>
                                    {voice.name}
                                </h3>
                                <p className="text-xs text-white/40">{voice.desc}</p>
                            </div>
                        </div>

                        {selectedVoice === voice.id
                            ? <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                            : <Circle className="w-5 h-5 text-white/10" />
                        }
                    </div>
                ))}
            </div>

            <button
                onClick={onNext}
                className="w-full bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-gray-100 transition-colors"
            >
                Continue
            </button>
        </motion.div>
    );
}
