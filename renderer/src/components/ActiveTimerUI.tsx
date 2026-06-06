
import React from 'react';
import { useAppStore } from '../context/AppContext';
import { Timer, X } from 'lucide-react';

export const ActiveTimerUI: React.FC = () => {
    const state = useAppStore(s => s.state);
    const actions = useAppStore(s => s.actions);
    const { activeTimers } = state;

    console.log('[ActiveTimerUI] Rendering, activeTimers count:', activeTimers.length);

    if (activeTimers.length === 0) return null;

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 pointer-events-none">
            {activeTimers.map((timer) => {
                const progress = (timer.remainingTime / timer.duration) * 100;
                const minutes = Math.floor(timer.remainingTime / 60);
                const seconds = timer.remainingTime % 60;

                return (
                    <div
                        key={timer.id}
                        className="pointer-events-auto group relative flex items-center gap-4 px-6 py-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500"
                    >
                        {/* Circular Progress Ring */}
                        <div className="relative w-12 h-12 flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle
                                    cx="24" cy="24" r="21"
                                    className="stroke-white/5 fill-none"
                                    strokeWidth="3"
                                />
                                <circle
                                    cx="24" cy="24" r="21"
                                    className="stroke-purple-500 fill-none transition-all duration-1000 ease-linear"
                                    strokeWidth="3"
                                    strokeDasharray={132}
                                    strokeDashoffset={132 - (132 * progress) / 100}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <Timer className="w-5 h-5 text-purple-400" />
                        </div>

                        <div className="flex flex-col min-w-[120px]">
                            <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">
                                {timer.label || "Countdown"}
                            </span>
                            <span className="text-white text-2xl font-mono tabular-nums leading-none">
                                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                            </span>
                        </div>

                        <button
                            onClick={() => actions.removeTimer(timer.id)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/20 hover:text-white/60"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Glossy Overlay */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                    </div>
                );
            })}
        </div>
    );
};
