import * as React from "react";
import * as ReactDOM from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface Option {
    label: string;
    value: string | number;
    description?: string;
}

interface IndustrialSelectProps {
    options: Option[];
    value: string | number;
    onChange: (value: any) => void;
    placeholder?: string;
    className?: string;
}

export function IndustrialSelect({ options, value, onChange, placeholder = "SELECT_OPTION", className }: IndustrialSelectProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});

    const selectedOption = options.find(o => o.value === value);

    // Recalculate position whenever dropdown opens
    React.useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: "fixed",
                top: rect.bottom + 6,
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
            });
        }
    }, [isOpen]);

    // Close on outside click
    React.useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [isOpen]);

    const dropdown = isOpen ? ReactDOM.createPortal(
        <div
            style={dropdownStyle}
            className="bg-[#08080a] border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-top-1 duration-300 overflow-hidden rounded-xl backdrop-blur-3xl"
        >
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {options.map((option) => (
                    <button
                        key={option.value}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onChange(option.value);
                            setIsOpen(false);
                        }}
                        className={cn(
                            "w-full px-5 py-3 flex items-center justify-between text-[11px] transition-all",
                            option.value === value
                                ? "bg-white/[0.05] text-white"
                                : "text-white/40 hover:bg-white/[0.02] hover:text-white"
                        )}
                    >
                        <div className="flex flex-col items-start gap-1">
                            <span className={cn("font-medium", option.value === value ? "text-white" : "text-white/60")}>{option.label}</span>
                            {option.description && (
                                <span className="text-[8px] opacity-40 lowercase tracking-normal font-sans italic">{option.description}</span>
                            )}
                        </div>
                        {option.value === value && <Check className="size-3 text-white/60 shrink-0" />}
                    </button>
                ))}
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className={cn("relative w-full", className)}>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full h-11 px-5 border text-[11px] font-medium transition-all flex items-center justify-between rounded-xl",
                    isOpen
                        ? "bg-white/[0.08] text-white border-white/20 shadow-lg"
                        : "bg-white/[0.02] border-white/[0.05] text-white/60 hover:border-white/20 hover:bg-white/[0.05]"
                )}
            >
                <span className="truncate">{selectedOption?.label || placeholder}</span>
                <ChevronDown className={cn("size-3.5 ml-2 opacity-30 transition-transform duration-500", isOpen ? "rotate-180" : "")} />
            </button>
            {dropdown}
        </div>
    );
}
