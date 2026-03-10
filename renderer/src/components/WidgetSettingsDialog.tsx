import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";

export interface WidgetSettings {
    zoom: number;
    opacity: number;
    blur: number; // css backdrop-blur (px)
    borderRadius: number; // % (0=square, 50=circle)
    size: number; // px (height/width) - assume square for now
}

interface WidgetSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    settings: WidgetSettings;
    onUpdate: (newSettings: WidgetSettings) => void;
}

export function WidgetSettingsDialog({ isOpen, onClose, settings, onUpdate }: WidgetSettingsDialogProps) {
    const [localSettings, setLocalSettings] = useState(settings);

    // Sync local with parent when prop changes (or initial open)
    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleChange = (key: keyof WidgetSettings, value: number) => {
        const updated = { ...localSettings, [key]: value };
        setLocalSettings(updated);
        onUpdate(updated); // Live update
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-[320px] bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                    <h3 className="text-xs font-medium tracking-wide text-white uppercase opacity-80">Widget Settings</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="size-6 text-muted-foreground hover:text-white">
                        <X className="w-3 h-3" />
                    </Button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-6">

                    {/* Window Size */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest">
                            <Label>Size</Label>
                            <span className="font-mono">{localSettings.size}px</span>
                        </div>
                        <Slider
                            value={[localSettings.size]}
                            min={200}
                            max={600}
                            step={10}
                            onValueChange={(val) => handleChange('size', val[0])}
                            className="py-1"
                        />
                    </div>

                    {/* Zoom */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest">
                            <Label>Zoom</Label>
                            <span className="font-mono">{(localSettings.zoom).toFixed(1)}x</span>
                        </div>
                        <Slider
                            value={[localSettings.zoom]}
                            min={0.5}
                            max={3}
                            step={0.1}
                            onValueChange={(val) => handleChange('zoom', val[0])}
                        />
                    </div>

                    {/* Opacity */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest">
                            <Label>Opacity</Label>
                            <span className="font-mono">{Math.round(localSettings.opacity * 100)}%</span>
                        </div>
                        <Slider
                            value={[localSettings.opacity]}
                            min={0}
                            max={1}
                            step={0.05}
                            onValueChange={(val) => handleChange('opacity', val[0])}
                        />
                    </div>

                    {/* Blur */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest">
                            <Label>Background Blur</Label>
                            <span className="font-mono">{localSettings.blur}px</span>
                        </div>
                        <Slider
                            value={[localSettings.blur]}
                            min={0}
                            max={20}
                            step={1}
                            onValueChange={(val) => handleChange('blur', val[0])}
                        />
                    </div>

                    {/* Border Radius (Shape) */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest">
                            <Label>Shape</Label>
                            <span className="font-mono text-[9px]">{localSettings.borderRadius > 25 ? "CIRCLE" : "SQUARE"}</span>
                        </div>
                        <Slider
                            value={[localSettings.borderRadius]}
                            min={0}
                            max={50}
                            step={5}
                            onValueChange={(val) => handleChange('borderRadius', val[0])}
                        />
                    </div>


                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-white/5 border-t border-white/5 flex justify-end">
                    <Button size="sm" variant="secondary" onClick={onClose} className="h-7 text-xs">
                        Done
                    </Button>
                </div>
            </div>
        </div>
    );
}
