import { motion } from "framer-motion";
import { Mic, Camera, Check, ChevronRight } from "lucide-react";
import { useState } from "react";

interface PermissionsProps {
    onNext: () => void;
}

export function Permissions({ onNext }: PermissionsProps) {
    const [micEnabled, setMicEnabled] = useState(false);
    const [camEnabled, setCamEnabled] = useState(false);

    const toggleMic = () => setMicEnabled(!micEnabled);
    const toggleCam = () => setCamEnabled(!camEnabled);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Enable Permissions</h2>
                <p className="text-sm text-white/60">
                    Athena runs locally. Your data never leaves this device.
                </p>
            </div>

            <div className="space-y-4 mb-8">
                {/* Microphone */}
                <div
                    onClick={toggleMic}
                    className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 flex items-center justify-between group
            ${micEnabled
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${micEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'}`}>
                            <Mic className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Microphone</h3>
                            <p className="text-xs text-white/50">Needed for voice conversation.</p>
                        </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors
            ${micEnabled ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                        {micEnabled && <Check className="w-4 h-4 text-black" />}
                    </div>
                </div>

                {/* Camera */}
                <div
                    onClick={toggleCam}
                    className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 flex items-center justify-between group
            ${camEnabled
                            ? 'bg-purple-500/10 border-purple-500/30'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${camEnabled ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-white/50'}`}>
                            <Camera className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Camera (Optional)</h3>
                            <p className="text-xs text-white/50">Enable gaze tracking & eye contact.</p>
                        </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors
            ${camEnabled ? 'bg-purple-500 border-purple-500' : 'border-white/20'}`}>
                        {camEnabled && <Check className="w-4 h-4 text-black" />}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <button
                    onClick={onNext}
                    className="w-full bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                >
                    Continue <ChevronRight className="w-4 h-4" />
                </button>
                <button
                    onClick={onNext} // Allows skip
                    className="text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                    Skip for now
                </button>
            </div>
        </motion.div>
    );
}
