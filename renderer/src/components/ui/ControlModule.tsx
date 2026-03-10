import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

interface ControlModuleProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

export function ControlModule({ title, children, defaultOpen = true, className }: ControlModuleProps) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    return (
        <div className={cn("rounded-xl border border-white/10 bg-white/2 overflow-hidden shadow-lg", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/4 transition-all group"
            >
                <span className="text-[12px] font-semibold text-white/70 group-hover:text-white/90 transition-all tracking-tight">{title}</span>
                <ChevronDown className={cn("size-4 text-white/20 group-hover:text-white/40 transition-all duration-500", isOpen ? "rotate-180" : "rotate-0")} />
            </button>
            <div className={cn(
                "transition-all duration-500 ease-in-out",
                isOpen ? "max-h-300 opacity-100 pb-4" : "max-h-0 opacity-0 overflow-hidden"
            )}>
                <div className="px-4 border-t border-white/5 pt-4">
                    {children}
                </div>
            </div>
        </div>
    );
}
