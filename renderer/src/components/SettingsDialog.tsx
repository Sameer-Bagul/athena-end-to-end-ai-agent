import * as React from "react";
import { X, Keyboard, Activity, Link as LinkIcon, Github, Linkedin, Mail } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Slider } from "./ui/slider";

export interface WidgetSettings {
    zoom: number;
    opacity: number;
    blur: number;
    borderRadius: number;
    size: number;
}

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    settings: WidgetSettings;
    onUpdate: (s: WidgetSettings) => void;
}

export function SettingsDialog({ isOpen, onClose, settings, onUpdate }: SettingsDialogProps) {
    const [activeTab, setActiveTab] = React.useState<'general' | 'widget' | 'integrations'>('general');
    const [wakeWord] = React.useState("Alt + Space");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[600px] h-[450px] bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl flex overflow-hidden ring-1 ring-white/5">

                {/* Sidebar */}
                <div className="w-48 bg-black/40 border-r border-white/5 p-4 flex flex-col gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 px-2">Settings</h3>

                    <TabButton
                        active={activeTab === 'general'}
                        onClick={() => setActiveTab('general')}
                        icon={<Keyboard className="size-4" />}
                        label="General"
                    />
                    <TabButton
                        active={activeTab === 'widget'}
                        onClick={() => setActiveTab('widget')}
                        icon={<Activity className="size-4" />}
                        label="Widget"
                    />
                    <TabButton
                        active={activeTab === 'integrations'}
                        onClick={() => setActiveTab('integrations')}
                        icon={<LinkIcon className="size-4" />}
                        label="Integrations"
                    />

                    <div className="mt-auto">
                        <Button variant="ghost" size="sm" onClick={onClose} className="w-full justify-start text-muted-foreground hover:text-white px-2 gap-2">
                            <X className="size-4" /> Close
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-white/5 to-transparent">

                    {/* --- Tab: General --- */}
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="space-y-1">
                                <h2 className="text-xl font-bold text-white">General Settings</h2>
                                <p className="text-xs text-muted-foreground">Configure global shortcuts and behavior.</p>
                            </div>
                            <Separator className="bg-white/10" />

                            <div className="space-y-4">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <Label className="text-xs text-muted-foreground mb-2 block">Wake Word Shortcut</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={wakeWord}
                                            readOnly
                                            className="bg-black/40 border-white/10 font-mono text-center tracking-widest text-primary"
                                        />
                                        <Button variant="outline" className="border-white/10 bg-white/5" disabled>Record</Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-2 opacity-60">Global shortcut to toggle voice listening mode.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- Tab: Widget --- */}
                    {activeTab === 'widget' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="space-y-1">
                                <h2 className="text-xl font-bold text-white">Widget Appearance</h2>
                                <p className="text-xs text-muted-foreground">Customize the floating companion widget.</p>
                            </div>
                            <Separator className="bg-white/10" />

                            <div className="space-y-6">
                                <SettingSlider
                                    label="Size (px)"
                                    value={[settings.size]}
                                    min={200} max={600} step={10}
                                    onChange={([v]) => onUpdate({ ...settings, size: v })}
                                />
                                <SettingSlider
                                    label="Camera Zoom"
                                    value={[settings.zoom]}
                                    min={0.2} max={1.5} step={0.1}
                                    onChange={([v]) => onUpdate({ ...settings, zoom: v })}
                                />
                                <SettingSlider
                                    label="Background Opacity"
                                    value={[settings.opacity]}
                                    min={0} max={1} step={0.05}
                                    onChange={([v]) => onUpdate({ ...settings, opacity: v })}
                                />
                                <SettingSlider
                                    label="Background Blur"
                                    value={[settings.blur]}
                                    min={0} max={20} step={1}
                                    onChange={([v]) => onUpdate({ ...settings, blur: v })}
                                />
                                <SettingSlider
                                    label="Border Radius"
                                    value={[settings.borderRadius]}
                                    min={0} max={100} step={1}
                                    onChange={([v]) => onUpdate({ ...settings, borderRadius: v })}
                                />
                            </div>
                        </div>
                    )}

                    {/* --- Tab: Integrations --- */}
                    {activeTab === 'integrations' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="space-y-1">
                                <h2 className="text-xl font-bold text-white">Connected Accounts</h2>
                                <p className="text-xs text-muted-foreground">Link external services for enhanced capabilities.</p>
                            </div>
                            <Separator className="bg-white/10" />

                            <div className="grid grid-cols-1 gap-3">
                                <IntegrationCard
                                    icon={<Mail className="size-5 text-red-400" />}
                                    name="Gmail"
                                    desc="Read and draft emails"
                                    connected={false}
                                />
                                <IntegrationCard
                                    icon={<Github className="size-5 text-white" />}
                                    name="GitHub"
                                    desc=" Access repositories and issues"
                                    connected={true}
                                />
                                <IntegrationCard
                                    icon={<Linkedin className="size-5 text-blue-400" />}
                                    name="LinkedIn"
                                    desc="Post updates and check messages"
                                    connected={false}
                                />
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

// --- Subcomponents ---

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200",
                active
                    ? "bg-primary/10 text-primary font-medium shadow-[inset_2px_0_0_0_var(--primary)]"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
            )}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

function SettingSlider({ label, value, min, max, step, onChange }: { label: string, value: number[], min: number, max: number, step: number, onChange: (val: number[]) => void }) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <Label className="text-xs font-medium text-gray-300">{label}</Label>
                <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-2 py-0.5 rounded text-right min-w-[3rem]">
                    {value[0]}
                </span>
            </div>
            <Slider
                value={value}
                min={min}
                max={max}
                step={step}
                onValueChange={onChange}
                className="[&_.relative]:h-1.5 [&_.bg-primary]:bg-primary [&_span]:active:scale-110"
            />
        </div>
    );
}

function IntegrationCard({ icon, name, desc, connected }: { icon: React.ReactNode, name: string, desc: string, connected: boolean }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    {icon}
                </div>
                <div>
                    <h4 className="text-sm font-medium text-white">{name}</h4>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
            </div>
            <Button
                size="sm"
                variant={connected ? "outline" : "default"}
                className={cn(
                    "h-7 text-[10px]",
                    connected
                        ? "border-green-500/20 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        : "bg-white/10 hover:bg-white/20 text-white"
                )}
            >
                {connected ? "Connected" : "Connect"}
            </Button>
        </div>
    )
}
