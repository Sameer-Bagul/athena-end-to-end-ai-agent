import { Cpu, Wifi } from "lucide-react";
import { useAppStore } from "../context/AppContext";

export function McpStatusUI() {
    const { state } = useAppStore();

    if (state.activeSidecars.length === 0) return null;

    return (
        <div className="absolute bottom-8 left-8 z-20 flex flex-col gap-2">
            <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1 flex items-center gap-2">
                <Cpu className="size-3" /> Active MCP Sidecars
            </div>
            <div className="flex flex-wrap gap-2">
                {state.activeSidecars.map(name => (
                    <div
                        key={name}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-left-2 duration-500"
                    >
                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-medium text-emerald-400 capitalize">{name}</span>
                        <Wifi className="size-3 text-emerald-500/50" />
                    </div>
                ))}
            </div>
        </div>
    );
}
