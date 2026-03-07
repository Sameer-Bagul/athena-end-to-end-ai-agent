import * as React from "react";
import * as ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface Option {
    label: string;
    value: string | number;
    description?: string;
    icon?: React.ReactNode;
}

interface OverlaySelectProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    options: Option[];
    value: string | number;
    onChange: (value: any) => void;
}

export function OverlaySelect({ isOpen, onClose, title, options, value, onChange }: OverlaySelectProps) {
    if (typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
                    />

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 m-auto w-full max-w-md h-fit z-[201] pointer-events-none p-6"
                    >
                        <div className="bg-[#0c0c0e] border border-white/10 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                                <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.1em]">{title}</h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                                <div className="grid grid-cols-1 gap-1">
                                    {options.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                onChange(option.value);
                                                onClose();
                                            }}
                                            className={cn(
                                                "w-full px-4 py-4 flex items-center gap-4 rounded-2xl transition-all group",
                                                option.value === value
                                                    ? "bg-white text-black font-bold"
                                                    : "text-white/40 hover:bg-white/5 hover:text-white"
                                            )}
                                        >
                                            {option.icon && (
                                                <div className={cn("size-8 flex items-center justify-center rounded-lg border",
                                                    option.value === value ? "border-black/20" : "border-white/10 bg-white/5")}>
                                                    {option.icon}
                                                </div>
                                            )}
                                            <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                                                <span className="text-[13px] truncate w-full tracking-wide">{option.label}</span>
                                                {option.description && (
                                                    <span className={cn("text-[10px] opacity-60 truncate w-full font-normal",
                                                        option.value === value ? "text-black/60" : "text-white/40")}>
                                                        {option.description}
                                                    </span>
                                                )}
                                            </div>
                                            {option.value === value && <Check className="size-4" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
