import React, { useState } from 'react';
import { AnimationAction } from '../three/AnimationManager';
import {
    LuUser,
    LuClapperboard,
    LuSettings,
    LuUpload,
    LuPlay,
    LuPause,
    LuLayoutGrid,
    LuMonitor,
    LuCheck
} from 'react-icons/lu';

// --- Types ---
type Tab = 'AVATAR' | 'ANIMATIONS' | 'SCENE';

interface ControlPanelProps {
    currentAnimation: AnimationAction;
    onAnimationChange: (action: AnimationAction) => void;
    isPlaying: boolean;
    onTogglePlay: () => void;
    isReady: boolean;
    onFileUpload: (file: File) => void;
}

// --- Constants ---
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'AVATAR', label: 'VRM', icon: LuUser },
    { id: 'ANIMATIONS', label: 'Motions', icon: LuClapperboard },
    { id: 'SCENE', label: 'Stage', icon: LuSettings },
];

const ANIMATION_LABELS: Record<AnimationAction, string> = {
    [AnimationAction.ANGRY]: 'Angry',
    [AnimationAction.BLUSH]: 'Blush',
    [AnimationAction.CLAPPING]: 'Clapping',
    [AnimationAction.GOODBYE]: 'Goodbye',
    [AnimationAction.JUMP]: 'Jump',
    [AnimationAction.LOOK_AROUND]: 'Look Around',
    [AnimationAction.RELAX]: 'Relax',
    [AnimationAction.SAD]: 'Sad',
    [AnimationAction.SLEEPY]: 'Sleepy',
    [AnimationAction.SURPRISED]: 'Surprised',
    [AnimationAction.THINKING]: 'Thinking',
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
    currentAnimation,
    onAnimationChange,
    isPlaying,
    onTogglePlay,
    isReady,
    onFileUpload,
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('ANIMATIONS');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            onFileUpload(event.target.files[0]);
        }
    };

    return (
        <div className="flex h-full bg-zinc-950 text-zinc-200 font-sans border-l border-white/5 shadow-2xl">
            {/* --- Right Navigation Rail (Tabs) --- */}
            <div className="w-16 flex flex-col items-center py-4 border-r border-white/5 bg-zinc-900/50">
                <div className="mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                        A
                    </div>
                </div>

                <div className="flex flex-col gap-2 w-full px-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                group relative flex flex-col items-center justify-center w-full py-3 rounded-lg transition-all duration-200
                ${activeTab === tab.id ? 'bg-white/5 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}
`}
                            title={tab.label}
                        >
                            <tab.icon className="text-xl mb-1" />
                            <span className="text-[9px] font-medium uppercase tracking-wide opacity-80">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="mt-auto flex flex-col gap-4 text-zinc-600 pb-4">
                    {/* Status Indicator at bottom */}
                    <div className={`w-2 h-2 rounded-full mx-auto ${isReady ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'} `}></div>
                </div>
            </div>

            {/* --- Content Area --- */}
            <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
                {/* Header (Minimal) */}
                <div className="h-14 border-b border-white/5 flex items-center px-6 justify-between bg-zinc-900/20">
                    <h2 className="text-sm font-semibold tracking-wide text-zinc-100">{TABS.find(t => t.id === activeTab)?.label}</h2>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

                    {/* AVATAR TAB */}
                    {activeTab === 'AVATAR' && (
                        <div className="space-y-6">
                            <div className="border border-dashed border-zinc-700 bg-zinc-900/30 rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors hover:border-indigo-500/50 hover:bg-zinc-900/50 group cursor-pointer relative">
                                <input
                                    type="file"
                                    accept=".vrm"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center mb-3 text-zinc-400 group-hover:text-indigo-400 group-hover:scale-105 transition-all">
                                    <LuUpload className="text-lg" />
                                </div>
                                <h3 className="text-zinc-200 font-medium text-sm mb-1">Upload VRM</h3>
                                <p className="text-zinc-500 text-xs text-center">Drag & drop or click</p>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Library</h3>
                                <button className="w-full p-3 rounded-lg bg-zinc-900 border border-white/5 flex items-center gap-3 hover:border-zinc-700 transition-all group">
                                    <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 group-hover:text-indigo-400">
                                        <LuUser />
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="text-sm font-medium text-zinc-200">Yuki</div>
                                        <div className="text-[10px] text-zinc-500">Default Model</div>
                                    </div>
                                    {/* Selected Check (Mock) */}
                                    <LuCheck className="text-indigo-500 text-sm" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ANIMATIONS TAB */}
                    {activeTab === 'ANIMATIONS' && (
                        <div className="space-y-4">
                            {/* Control Bar */}
                            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-2">
                                <span className="text-xs text-zinc-400">Current Action</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={onTogglePlay}
                                        className={`
                                    flex items-center gap-2 px-4 py-1.5 rounded text-xs font-medium transition-colors border
                                    ${isPlaying
                                                ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'
                                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'
                                            }
`}
                                    >
                                        {isPlaying ? <LuPause /> : <LuPlay />}
                                        {isPlaying ? 'Stop' : 'Play'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                {Object.values(AnimationAction).map((action) => (
                                    <button
                                        key={action}
                                        onClick={() => onAnimationChange(action)}
                                        className={`
                                group w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 border
                                ${currentAnimation === action
                                                ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-300'
                                                : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                                            }
`}
                                    >
                                        <span className={`text-[10px] uppercase font-bold tracking-wider w-8 text-right opacity-50`}>
                                            {/* Just an index-like number or icon */}
                                            {action.substring(0, 2)}
                                        </span>
                                        <span className="text-xs font-medium flex-1 text-left">{ANIMATION_LABELS[action]}</span>
                                        {currentAnimation === action && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SCENE TAB */}
                    {activeTab === 'SCENE' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Viewport</h3>

                                <div className="p-3 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <LuLayoutGrid className="text-zinc-400" />
                                        <span className="text-sm text-zinc-300">Floor Grid</span>
                                    </div>
                                    {/* Toggle Switch Mock */}
                                    <div className="w-8 h-4 bg-indigo-600 rounded-full relative cursor-pointer opacity-80 hover:opacity-100">
                                        <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                                    </div>
                                </div>

                                <div className="p-3 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-between opacity-50 cursor-not-allowed">
                                    <div className="flex items-center gap-3">
                                        <LuMonitor className="text-zinc-400" />
                                        <span className="text-sm text-zinc-300">Post Processing</span>
                                    </div>
                                    {/* Toggle Switch Mock (Off) */}
                                    <div className="w-8 h-4 bg-zinc-700 rounded-full relative">
                                        <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-zinc-400 rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Environment</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button className="px-3 py-6 rounded-lg bg-zinc-950 border border-indigo-500 text-xs font-medium text-white flex flex-col items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-700"></div>
                                        Dark Matte
                                    </button>
                                    <button className="px-3 py-6 rounded-lg bg-zinc-100 border border-transparent text-xs font-medium text-zinc-900 flex flex-col items-center gap-2 hover:bg-white transition-colors">
                                        <div className="w-4 h-4 rounded-full bg-white border border-zinc-300"></div>
                                        Light Studio
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
