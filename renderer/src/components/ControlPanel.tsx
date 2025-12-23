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
    { id: 'AVATAR', label: 'Model', icon: LuUser },
    { id: 'ANIMATIONS', label: 'Anim', icon: LuClapperboard },
    { id: 'SCENE', label: 'Scene', icon: LuSettings },
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
    // isReady is passed but not used after removing the status indicator
    onFileUpload,
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('ANIMATIONS');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            onFileUpload(event.target.files[0]);
        }
    };

    return (
        <div className="flex h-full bg-zinc-950 text-zinc-200 font-sans border-l border-white/10">
            {/* --- Navigation Rail (Tabs) --- */}
            <div className="w-16 flex flex-col items-center py-8 border-r border-white/5 bg-zinc-900/30">
                <div className="flex flex-col gap-3 w-full px-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                group relative flex flex-col items-center justify-center w-full py-4 rounded-lg transition-all duration-150
                ${activeTab === tab.id ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/5'}
`}
                            title={tab.label}
                        >
                            <tab.icon className="text-lg" />
                            <span className="text-[8px] font-medium uppercase tracking-wider mt-1 opacity-70">{tab.label}</span>
                            {activeTab === tab.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-indigo-500 rounded-r"></div>}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- Content Area --- */}
            <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
                {/* Header */}
                <div className="h-16 border-b border-white/5 flex items-center px-8 bg-zinc-900/10">
                    <h2 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">{TABS.find(t => t.id === activeTab)?.label}</h2>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-8">

                    {/* AVATAR TAB */}
                    {activeTab === 'AVATAR' && (
                        <div className="space-y-8">
                            <div className="border border-dashed border-zinc-800 bg-zinc-900/20 rounded-lg p-10 flex flex-col items-center justify-center text-center transition-all hover:border-indigo-500/30 hover:bg-zinc-900/30 group cursor-pointer relative">
                                <input
                                    type="file"
                                    accept=".vrm"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center mb-4 text-zinc-500 group-hover:text-indigo-400 transition-all">
                                    <LuUpload className="text-lg" />
                                </div>
                                <h3 className="text-zinc-300 font-medium text-sm mb-1">Upload VRM</h3>
                                <p className="text-zinc-600 text-[11px]">Click or drag file</p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">Current</h3>
                                <button className="w-full p-4 rounded-lg bg-zinc-900/40 border border-indigo-500/20 flex items-center gap-4 hover:bg-zinc-900/60 transition-all group">
                                    <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center text-sm text-zinc-500 group-hover:text-indigo-400">
                                        <LuUser />
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="text-sm font-medium text-zinc-200">Athena</div>
                                        <div className="text-[10px] text-zinc-600">Default</div>
                                    </div>
                                    <LuCheck className="text-indigo-500 text-sm" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ANIMATIONS TAB */}
                    {activeTab === 'ANIMATIONS' && (
                        <div className="space-y-6">
                            {/* Control Bar */}
                            <div className="flex items-center justify-between pb-5 border-b border-white/5">
                                <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">Playback</span>
                                <button
                                    onClick={onTogglePlay}
                                    className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all
                                    ${isPlaying
                                            ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                                            : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                                        }
`}
                                >
                                    {isPlaying ? <LuPause className="text-sm" /> : <LuPlay className="text-sm" />}
                                    {isPlaying ? 'Stop' : 'Play'}
                                </button>
                            </div>

                            {/* 2-Column Grid for Animations */}
                            <div className="grid grid-cols-2 gap-3">
                                {Object.values(AnimationAction).map((action) => (
                                    <button
                                        key={action}
                                        onClick={() => onAnimationChange(action)}
                                        className={`
                                group relative px-4 py-4 rounded-lg transition-all duration-150 text-left
                                ${currentAnimation === action
                                                ? 'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30'
                                                : 'bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900/70 hover:text-zinc-200'
                                            }
`}
                                    >
                                        <span className="text-xs font-medium block">{ANIMATION_LABELS[action]}</span>
                                        {currentAnimation === action && (
                                            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SCENE TAB */}
                    {activeTab === 'SCENE' && (
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">Display</h3>

                                <div className="p-4 rounded-lg bg-zinc-900/40 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <LuLayoutGrid className="text-zinc-500 text-base" />
                                        <span className="text-sm text-zinc-300">Grid</span>
                                    </div>
                                    <div className="w-9 h-5 bg-indigo-500/80 rounded-full relative cursor-pointer hover:bg-indigo-500">
                                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow"></div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg bg-zinc-900/40 flex items-center justify-between opacity-40 cursor-not-allowed">
                                    <div className="flex items-center gap-3">
                                        <LuMonitor className="text-zinc-500 text-base" />
                                        <span className="text-sm text-zinc-300">Effects</span>
                                    </div>
                                    <div className="w-9 h-5 bg-zinc-800 rounded-full relative">
                                        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-zinc-600 rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">Theme</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="px-4 py-6 rounded-lg bg-zinc-950 ring-1 ring-indigo-500/40 text-xs font-medium text-white flex flex-col items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-700"></div>
                                        Dark
                                    </button>
                                    <button className="px-4 py-6 rounded-lg bg-zinc-100 text-xs font-medium text-zinc-900 flex flex-col items-center gap-2 hover:bg-white transition-colors">
                                        <div className="w-4 h-4 rounded-full bg-white border border-zinc-300"></div>
                                        Light
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
