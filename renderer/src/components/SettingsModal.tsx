import * as React from "react";
import { X, Save, Box, Cpu, Key, Globe } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { cn } from "../lib/utils";

export interface AIConfig {
    provider: 'ollama' | 'openai' | 'grok' | 'gemini';
    apiKey: string;
    model: string;
    endpoint?: string;
}

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: AIConfig;
    onSave: (config: AIConfig) => void;
}

export function SettingsModal({ isOpen, onClose, config, onSave }: SettingsModalProps) {
    const [localConfig, setLocalConfig] = React.useState<AIConfig>(config);
    const [activeTab, setActiveTab] = React.useState<'intelligence' | 'audio' | 'general'>('intelligence');

    React.useEffect(() => {
        setLocalConfig(config);
    }, [config, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(localConfig);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-200 h-150 bg-[#09090b] border border-white/10 rounded-xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Sidebar */}
                <div className="w-64 bg-black/20 border-r border-white/5 p-4 flex flex-col gap-2">
                    <div className="px-2 py-4 mb-4">
                        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                            <Box className="size-5 text-primary" />
                            System Config
                        </h2>
                    </div>

                    {[
                        { id: 'intelligence', label: 'Intelligence', icon: Cpu },
                        // { id: 'audio', label: 'Audio & Voice', icon: Sparkles }, // Future
                        // { id: 'general', label: 'General', icon: Menu }, // Future
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'intelligence' | 'audio' | 'general')}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all text-left",
                                activeTab === tab.id
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <tab.icon className="size-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <div className="h-16 border-b border-white/5 flex items-center justify-between px-8">
                        <h3 className="text-lg font-semibold text-white">
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings
                        </h3>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
                            <X className="size-5" />
                        </Button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {activeTab === 'intelligence' && (
                            <div className="space-y-8 max-w-xl">

                                <div className="space-y-4">
                                    <Label className="text-base">AI Provider</Label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['ollama', 'openai', 'grok', 'gemini'].map((p) => (
                                            <div
                                                key={p}
                                                onClick={() => setLocalConfig(prev => ({ ...prev, provider: p as 'ollama' | 'openai' | 'grok' | 'gemini' }))}
                                                className={cn(
                                                    "cursor-pointer rounded-lg border p-4 flex flex-col items-center justify-center gap-2 transition-all hover:bg-white/5",
                                                    localConfig.provider === p
                                                        ? "border-primary bg-primary/5 text-primary"
                                                        : "border-white/10 text-muted-foreground"
                                                )}
                                            >
                                                <span className="capitalize font-bold text-sm">{p}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator className="bg-white/5" />

                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="api-key" className="flex items-center gap-2">
                                            <Key className="size-4" /> API Key
                                        </Label>
                                        <Input
                                            id="api-key"
                                            type="password"
                                            placeholder={localConfig.provider === 'ollama' ? "Not required for local Ollama" : "sk-..."}
                                            value={localConfig.apiKey}
                                            onChange={(e) => setLocalConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                                            disabled={localConfig.provider === 'ollama'}
                                            className="bg-black/20 border-white/10"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Your keys are stored locally in your browser and never sent to our servers.
                                        </p>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="model" className="flex items-center gap-2">
                                            <Box className="size-4" /> Target Model
                                        </Label>
                                        <Input
                                            id="model"
                                            placeholder="e.g. gpt-4-turbo, llama3, gemini-pro"
                                            value={localConfig.model}
                                            onChange={(e) => setLocalConfig(prev => ({ ...prev, model: e.target.value }))}
                                            className="bg-black/20 border-white/10"
                                        />
                                    </div>

                                    {localConfig.provider === 'ollama' && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="endpoint" className="flex items-center gap-2">
                                                <Globe className="size-4" /> Endpoint URL
                                            </Label>
                                            <Input
                                                id="endpoint"
                                                placeholder="http://localhost:11434"
                                                value={localConfig.endpoint || "http://localhost:11434"}
                                                onChange={(e) => setLocalConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                                                className="bg-black/20 border-white/10"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-black/20">
                        <Button variant="ghost" onClick={onClose} className="hover:bg-white/5">Cancel</Button>
                        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-black font-bold">
                            <Save className="size-4 mr-2" />
                            Save Configuration
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
