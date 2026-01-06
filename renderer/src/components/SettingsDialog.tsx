import * as React from "react";
import { X, Keyboard, Activity, Link as LinkIcon, User, Newspaper, CloudSun, BrainCircuit, Server, Zap, Cpu } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Slider } from "./ui/slider";
import { Textarea } from "./ui/textarea";
import { useAppStore } from "../context/AppContext";

export interface WidgetSettings {
    zoom: number;
    opacity: number;
    blur: number;
    borderRadius: number;
    size: number;
    borderWidth?: number;
}

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    settings: WidgetSettings;
    onUpdate: (s: WidgetSettings) => void;
}

export function SettingsDialog({ isOpen, onClose, settings: _initialSettings, onUpdate }: SettingsDialogProps) {
    const { state, actions } = useAppStore();
    const [activeTab, setActiveTab] = React.useState<'general' | 'profile' | 'ai' | 'widget' | 'plugins'>('general');
    const [wakeWord] = React.useState("Alt + Space");

    // Local state
    const [profileName, setProfileName] = React.useState(state.userProfile.name);
    const [profileBio, setProfileBio] = React.useState(state.userProfile.bio);
    const [newsKey, setNewsKey] = React.useState(state.pluginConfig.newsApiKey);
    const [weatherKey, setWeatherKey] = React.useState(state.pluginConfig.weatherApiKey);

    // AI Config Local State
    const [aiPriority, setAiPriority] = React.useState(state.aiConfig.priority);
    const [ollamaConfig, setOllamaConfig] = React.useState(Array.isArray(state.aiConfig.ollama) ? state.aiConfig.ollama : [state.aiConfig.ollama]);
    const [lmStudioConfig, setLmStudioConfig] = React.useState(Array.isArray(state.aiConfig.lmstudio) ? state.aiConfig.lmstudio : [state.aiConfig.lmstudio]);
    const [grokConfig, setGrokConfig] = React.useState(Array.isArray(state.aiConfig.grok) ? state.aiConfig.grok : [state.aiConfig.grok]);
    const [geminiConfig, setGeminiConfig] = React.useState(Array.isArray(state.aiConfig.gemini) ? state.aiConfig.gemini : [state.aiConfig.gemini]);

    // Sync from state when opened
    React.useEffect(() => {
        if (isOpen) {
            setProfileName(state.userProfile.name);
            setProfileBio(state.userProfile.bio);
            setNewsKey(state.pluginConfig.newsApiKey);
            setWeatherKey(state.pluginConfig.weatherApiKey);

            setAiPriority(state.aiConfig.priority || ['ollama', 'gemini', 'grok', 'lmstudio']);
            setOllamaConfig(Array.isArray(state.aiConfig.ollama) ? state.aiConfig.ollama : [state.aiConfig.ollama]);
            setLmStudioConfig(Array.isArray(state.aiConfig.lmstudio) ? state.aiConfig.lmstudio : [state.aiConfig.lmstudio]);
            setGrokConfig(Array.isArray(state.aiConfig.grok) ? state.aiConfig.grok : [state.aiConfig.grok]);
            setGeminiConfig(Array.isArray(state.aiConfig.gemini) ? state.aiConfig.gemini : [state.aiConfig.gemini]);
        }
    }, [isOpen, state.userProfile, state.pluginConfig, state.aiConfig]);

    // Save on changes
    const handleProfileUpdate = () => actions.setUserProfile({ name: profileName, bio: profileBio });
    const handlePluginUpdate = () => actions.setPluginConfig({ newsApiKey: newsKey, weatherApiKey: weatherKey });

    const handleAiUpdate = () => {
        actions.setAiConfig({
            priority: aiPriority,
            ollama: ollamaConfig,
            lmstudio: lmStudioConfig,
            grok: grokConfig,
            gemini: geminiConfig
        });
    };

    React.useEffect(() => {
        if (isOpen) handleAiUpdate();
    }, [aiPriority]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
            {/* Backdrop with heavy blur */}
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={onClose} />

            {/* Main Diamond/Glass Container */}
            <div className="relative w-[900px] h-[600px] bg-black/80 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-2xl flex overflow-hidden ring-1 ring-white/10">

                {/* Minimal Sidebar */}
                <div className="w-16 md:w-64 flex flex-col border-r border-white/5 pt-6 pb-4 bg-white/[0.02]">
                    <div className="px-6 mb-6">
                        <h2 className="text-xs font-semibold tracking-[0.2em] text-white/40 uppercase hidden md:block">Settings</h2>
                        <div className="md:hidden flex justify-center"><Activity className="size-5 text-white/40" /></div>
                    </div>

                    <div className="flex-1 flex flex-col gap-1 px-3">
                        <NavButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<Keyboard className="size-4" />} label="General" />
                        <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User className="size-4" />} label="Identity" />
                        <NavButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<BrainCircuit className="size-4" />} label="Intelligence" />
                        <NavButton active={activeTab === 'widget'} onClick={() => setActiveTab('widget')} icon={<Activity className="size-4" />} label="Widget" />
                        <NavButton active={activeTab === 'plugins'} onClick={() => setActiveTab('plugins')} icon={<LinkIcon className="size-4" />} label="Connect" />
                    </div>

                    <div className="px-3 mt-auto">
                        <Button variant="ghost" className="w-full justify-start text-white/40 hover:text-white hover:bg-white/5" onClick={onClose}>
                            <X className="size-4 mr-2" /> <span className="hidden md:inline">Close</span>
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-2xl mx-auto py-8 px-8">

                        {/* Tab Content Wrapper with Animation */}
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">

                            {/* GENERAL TAB */}
                            {activeTab === 'general' && (
                                <Section title="System Preferences" description="Global shortcuts & app behavior.">
                                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                                        <Label className="text-xs font-medium text-white/60 mb-3 block uppercase tracking-wider">Wake Word</Label>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-12 flex items-center justify-center rounded-xl bg-black/40 border border-white/10 font-mono text-sm tracking-widest text-primary shadow-inner">
                                                {wakeWord}
                                            </div>
                                            <Button variant="outline" className="h-12 px-6 border-white/10 bg-white/5 hover:bg-white/10" disabled>
                                                Change
                                            </Button>
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {/* PROFILE TAB */}
                            {activeTab === 'profile' && (
                                <Section title="User Identity" description="How Athena recognizes & addresses you.">
                                    <div className="space-y-6">
                                        <div className="group">
                                            <Label className="text-xs font-medium text-white/60 mb-2 block ml-1">Display Name</Label>
                                            <Input
                                                value={profileName}
                                                onChange={(e) => setProfileName(e.target.value)}
                                                onBlur={handleProfileUpdate}
                                                className="bg-white/[0.03] border-white/5 focus:border-primary/50 text-white h-12 rounded-xl px-4 transition-all"
                                                placeholder="Your Name"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs font-medium text-white/60 mb-2 block ml-1">Context & Bio</Label>
                                            <Textarea
                                                value={profileBio}
                                                onChange={(e) => setProfileBio(e.target.value)}
                                                onBlur={handleProfileUpdate}
                                                className="bg-white/[0.03] border-white/5 focus:border-primary/50 text-white min-h-[120px] rounded-xl p-4 transition-all resize-none"
                                                placeholder="Share your context..."
                                            />
                                            <p className="text-[10px] text-white/20 mt-2 ml-1">Added to system prompt for personalization.</p>
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {/* AI TAB */}
                            {activeTab === 'ai' && (
                                <Section title="Intelligence Core" description="Provider priority & Multi-key redundancy.">

                                    {/* Priority List */}
                                    <div className="mb-8">
                                        <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 block">Processing Order</Label>
                                        <div className="space-y-2">
                                            {aiPriority.map((provider, index) => (
                                                <div
                                                    key={provider}
                                                    draggable
                                                    onDragStart={(e) => { e.dataTransfer.setData('idx', index.toString()); }}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => {
                                                        const f = parseInt(e.dataTransfer.getData('idx'));
                                                        if (f === index) return;
                                                        const n = [...aiPriority];
                                                        const [m] = n.splice(f, 1);
                                                        n.splice(index, 0, m);
                                                        setAiPriority(n);
                                                    }}
                                                    className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] cursor-move transition-colors group"
                                                >
                                                    <div className="size-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/50 group-hover:text-white">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-white capitalize">{provider === 'lmstudio' ? 'LM Studio' : provider}</div>
                                                    </div>
                                                    <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] text-white/40">
                                                        {provider === 'ollama' ? ollamaConfig.length :
                                                            provider === 'lmstudio' ? lmStudioConfig.length :
                                                                provider === 'grok' ? grokConfig.length : geminiConfig.length} Nodes
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator className="bg-white/5 mb-8" />

                                    {/* Config Cards */}
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 block">Node Configuration</Label>

                                        <ConfigGroup title="Ollama" icon={<Server className="size-4" />} configs={ollamaConfig} setConfigs={setOllamaConfig}
                                            template={{ baseUrl: "http://localhost:11434", model: "dolphin-mistral" }}
                                            fields={['baseUrl', 'model']} onBlur={handleAiUpdate}
                                        />

                                        <ConfigGroup title="Gemini" icon={<BrainCircuit className="size-4" />} configs={geminiConfig} setConfigs={setGeminiConfig}
                                            template={{ apiKey: "", model: "gemini-pro" }}
                                            fields={['apiKey', 'model']} onBlur={handleAiUpdate}
                                        />

                                        <ConfigGroup title="Grok" icon={<Zap className="size-4" />} configs={grokConfig} setConfigs={setGrokConfig}
                                            template={{ apiKey: "", model: "grok-beta" }}
                                            fields={['apiKey', 'model']} onBlur={handleAiUpdate}
                                        />

                                        <ConfigGroup title="LM Studio" icon={<Cpu className="size-4" />} configs={lmStudioConfig} setConfigs={setLmStudioConfig}
                                            template={{ baseUrl: "http://localhost:1234/v1", model: "local-model" }}
                                            fields={['baseUrl', 'model']} onBlur={handleAiUpdate}
                                        />
                                    </div>
                                </Section>
                            )}

                            {/* WIDGET TAB */}
                            {activeTab === 'widget' && (
                                <Section title="Widget Appearance" description="Customize your floating companion.">
                                    <div className="grid gap-6 p-1">
                                        <MinimalSlider label="Size" value={state.widgetSettings.size} min={200} max={600} step={10}
                                            onChange={(v) => onUpdate({ ...state.widgetSettings, size: v })} unit="px" />
                                        <MinimalSlider label="Zoom" value={state.widgetSettings.zoom} min={0.2} max={2.0} step={0.1}
                                            onChange={(v) => onUpdate({ ...state.widgetSettings, zoom: v })} />
                                        <MinimalSlider label="Opacity" value={state.widgetSettings.opacity} min={0} max={1} step={0.05}
                                            onChange={(v) => onUpdate({ ...state.widgetSettings, opacity: v })} />
                                        <MinimalSlider label="Blur" value={state.widgetSettings.blur} min={0} max={20} step={1}
                                            onChange={(v) => onUpdate({ ...state.widgetSettings, blur: v })} unit="px" />
                                        <MinimalSlider label="Corner Radius" value={state.widgetSettings.borderRadius} min={0} max={100} step={2}
                                            onChange={(v) => onUpdate({ ...state.widgetSettings, borderRadius: v })} unit="px" />
                                    </div>
                                </Section>
                            )}

                            {/* PLUGINS TAB */}
                            {activeTab === 'plugins' && (
                                <Section title="External Links" description="Connect third-party APIs.">
                                    <div className="grid gap-4">
                                        <PluginCard icon={<Newspaper className="text-orange-400" />} title="News API"
                                            value={newsKey} setValue={setNewsKey} onBlur={handlePluginUpdate} placeholder="newsapi.org Key" />
                                        <PluginCard icon={<CloudSun className="text-blue-400" />} title="OpenWeather"
                                            value={weatherKey} setValue={setWeatherKey} onBlur={handlePluginUpdate} placeholder="openweathermap.org Key" />
                                    </div>
                                </Section>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Minimal Components ---

interface NavButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

function NavButton({ active, onClick, icon, label }: NavButtonProps) {
    return (
        <button onClick={onClick} className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
            active ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
        )}>
            {active && <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full shadow-[0_0_10px_var(--primary)]" />}
            <span className={cn("transition-transform duration-300", active && "scale-110 text-primary")}>{icon}</span>
            <span className="text-sm font-medium tracking-wide hidden md:block">{label}</span>
        </button>
    )
}

interface SectionProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-1 mb-8">
                <h2 className="text-2xl font-light text-white tracking-tight">{title}</h2>
                <p className="text-sm text-white/40 font-light">{description}</p>
            </div>
            {children}
        </div>
    )
}

interface ConfigGroupProps {
    title: string;
    icon: React.ReactNode;
    configs: any[];
    setConfigs: (c: any[]) => void;
    template: any;
    fields: string[];
    onBlur: () => void;
}

function ConfigGroup({ title, icon, configs, setConfigs, template, fields, onBlur }: ConfigGroupProps) {
    return (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-2 text-white/70">
                {icon} <span className="text-sm font-medium">{title}</span>
            </div>
            {configs.map((c: any, i: number) => (
                <div key={i} className="flex gap-2 items-start animate-in fade-in slide-in-from-left-2">
                    <div className={cn("grid gap-2 flex-1", fields.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                        {fields.map((f: string) => (
                            <Input key={f}
                                value={c[f]} placeholder={f === 'baseUrl' ? 'Base URL' : f === 'apiKey' ? 'API Key' : 'Model'}
                                onChange={e => {
                                    const n = [...configs];
                                    // Sanitize accidental quotes immediately on input for key/model
                                    let val = e.target.value;
                                    if (f !== 'baseUrl') val = val.replace(/["']/g, "");
                                    n[i][f] = val;
                                    setConfigs(n);
                                }}
                                onBlur={() => {
                                    // Trim on blur
                                    const n = [...configs];
                                    if (typeof n[i][f] === 'string') n[i][f] = n[i][f].trim();
                                    setConfigs(n);
                                    onBlur();
                                }}
                                className="bg-black/20 border-white/5 focus:border-white/20 text-xs font-mono text-white/80 h-9"
                            />
                        ))}
                    </div>
                    <Button variant="ghost" size="icon" className="size-9 text-white/20 hover:text-red-400 hover:bg-red-400/10"
                        onClick={() => setConfigs(configs.filter((_: any, idx: number) => idx !== i))}
                        disabled={configs.length <= 1 && i === 0}
                    >
                        <X className="size-4" />
                    </Button>
                </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full border border-dashed border-white/5 text-xs text-white/30 hover:text-white hover:bg-white/5"
                onClick={() => setConfigs([...configs, { ...template }])}>
                + Add Redundant Node
            </Button>
        </div>
    )
}

interface MinimalSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (val: number) => void;
    unit?: string;
}

function MinimalSlider({ label, value, min, max, step, onChange, unit = '' }: MinimalSliderProps) {
    return (
        <div className="flex items-center gap-4 group">
            <Label className="w-24 text-xs font-medium text-white/40 group-hover:text-white/60 transition-colors">{label}</Label>
            <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} className="flex-1" />
            <div className="w-12 text-right text-xs font-mono text-white/60">{value}{unit}</div>
        </div>
    )
}

interface PluginCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    setValue: (v: string) => void;
    onBlur: () => void;
    placeholder: string;
}

function PluginCard({ icon, title, value, setValue, onBlur, placeholder }: PluginCardProps) {
    return (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
            <div className="flex-1 space-y-1">
                <div className="text-sm font-medium text-white/80">{title}</div>
                <Input type="password" value={value} onChange={e => setValue(e.target.value)} onBlur={onBlur}
                    className="bg-black/20 border-white/5 h-8 text-xs font-mono" placeholder={placeholder} />
            </div>
        </div>
    )
}

