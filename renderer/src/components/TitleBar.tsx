import { Minus, Square, X } from "lucide-react";

export function TitleBar() {
    const handleMinimize = () => window.athena.minimizeWindow();
    const handleMaximize = () => window.athena.maximizeWindow();
    const handleClose = () => window.athena.closeWindow();

    return (
        <div className="h-10 w-full flex items-center justify-between bg-black/40 backdrop-blur-md border-b border-white/5 select-none z-[9999] relative">
            {/* Drag Region */}
            <div
                className="absolute inset-0 w-full h-full"
                style={{ WebkitAppRegion: 'drag' } as any}
            />

            {/* Title */}
            <div className="px-4 flex items-center gap-2 relative z-10 pointer-events-none">
                <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-xs font-mono text-white/60 tracking-widest uppercase">Athena</span>
            </div>

            {/* Window Controls (No Drag) */}
            <div className="flex h-full relative z-20" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button
                    onClick={handleMinimize}
                    className="w-12 h-full flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <button
                    onClick={handleMaximize}
                    className="w-12 h-full flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                    <Square className="w-3 h-3" />
                </button>
                <button
                    onClick={handleClose}
                    className="w-12 h-full flex items-center justify-center hover:bg-red-500 hover:text-white text-white/60 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
