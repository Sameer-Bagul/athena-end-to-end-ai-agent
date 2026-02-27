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
            className="bg-[#0a0a0a] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-top-1 duration-200 overflow-hidden rounded-xl"
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
                            "w-full px-4 py-3 flex items-center justify-between text-[10px] tracking-[0.15em] uppercase font-mono transition-all",
                            option.value === value
                                ? "bg-white/10 text-white"
                                : "text-white/60 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <div className="flex flex-col items-start gap-1">
                            <span className={cn("font-bold", option.value === value ? "text-white" : "text-white/80")}>{option.label}</span>
                            {option.description && (
                                <span className="text-[8px] opacity-50 lowercase tracking-normal font-sans italic text-white">{option.description}</span>
                            )}
                        </div>
                        {option.value === value && <Check className="size-3.5 text-white shrink-0" />}
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
                    "w-full h-10 px-4 border text-[10px] tracking-[0.2em] font-mono uppercase transition-all flex items-center justify-between rounded-xl",
                    isOpen
                        ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                        : "bg-transparent border-white/20 text-white hover:border-white/40 hover:bg-white/[0.04]"
                )}
            >
                <span className="truncate font-bold">{selectedOption?.label || placeholder}</span>
                <ChevronDown className={cn("size-3.5 ml-2 shrink-0 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
            </button>
            {dropdown}
        </div>
    );
}
