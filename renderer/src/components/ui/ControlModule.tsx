import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

interface ControlModuleProps {
    id: string;
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

export function ControlModule({ id, title, children, defaultOpen = true, className }: ControlModuleProps) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    return (
        <div className={cn("rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-lg", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.04] transition-all group"
            >
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-sans text-white/40 group-hover:text-white/60 transition-colors">{id}</span>
                    <span className="text-[12px] font-semibold text-white/70 group-hover:text-white/90 transition-all tracking-tight">{title}</span>
                </div>
                <ChevronDown className={cn("size-4 text-white/20 group-hover:text-white/40 transition-all duration-500", isOpen ? "rotate-180" : "rotate-0")} />
            </button>
            <div className={cn(
                "transition-all duration-500 ease-in-out",
                isOpen ? "max-h-[1200px] opacity-100 pb-4" : "max-h-0 opacity-0 overflow-hidden"
            )}>
                <div className="px-4 border-t border-white/5 pt-4">
                    {children}
                </div>
            </div>
        </div>
    );
}
