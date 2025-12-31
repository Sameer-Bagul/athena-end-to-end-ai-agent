import * as React from "react";
import { Send, Bot, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatOverlayProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    onClearHistory?: () => void;
    isProcessing: boolean;
}

export function ChatOverlay({ messages, onSendMessage, onClearHistory, isProcessing }: ChatOverlayProps) {
    const [input, setInput] = React.useState("");
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing) return;
        onSendMessage(input);
        setInput("");
    };

    return (
        <div className="fixed top-0 right-0 h-full w-[380px] z-40 p-6 pointer-events-none flex flex-col justify-end font-sans">

            {/* Sidebar Container */}
            <div className="
                pointer-events-auto
                flex flex-col h-full w-full
                glass-panel
                rounded-2xl overflow-hidden
                shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]
            ">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/5 shrink-0 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl border border-white/10 shadow-inner">
                            <Bot className="size-5 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-foreground tracking-wide">ATHENA <span className="text-secondary opacity-80">AI</span></h3>
                            <div className="flex items-center gap-2">
                                <span className={cn("size-2 rounded-full shadow-[0_0_8px_currentColor]", isProcessing ? "bg-accent animate-pulse" : "bg-primary")} />
                                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                                    {isProcessing ? "Thinking..." : "Ready"}
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* Clear Button */}
                    {messages.length > 1 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                if (confirm("Clear chat history?")) {
                                    onClearHistory?.();
                                }
                            }}
                            className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                            <span className="sr-only">Clear</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c0 1 1 2 2 2v2" /></svg>
                        </Button>
                    )}
                </div>

                {/* Message History */}
                <div className="flex-1 w-full overflow-y-auto p-5 space-y-6 scrollbar-thin">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center text-center py-20 opacity-40 space-y-3">
                            <div className="p-4 rounded-full bg-white/5 mb-2">
                                <MessageSquare className="size-6 text-foreground" />
                            </div>
                            <p className="text-sm font-light tracking-wide">
                                System Online.<br />Awaiting Input.
                            </p>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "flex flex-col gap-2 max-w-full animate-in slide-in-from-bottom-2 duration-300 fill-mode-backwards",
                                msg.role === "user" ? "items-end" : "items-start"
                            )}
                            style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                            {/* Avatar/Label Row */}
                            <div className={cn(
                                "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-60",
                                msg.role === "user" ? "flex-row-reverse text-secondary" : "flex-row text-primary"
                            )}>
                                <span>{msg.role === "user" ? "You" : "Athena"}</span>
                            </div>

                            {/* Bubble */}
                            <div className={cn(
                                "rounded-2xl px-5 py-3 text-sm leading-relaxed max-w-[90%] break-words shadow-sm backdrop-blur-sm",
                                msg.role === "user"
                                    ? "bg-gradient-to-br from-secondary/80 to-purple-600/80 text-white rounded-tr-sm border border-white/10"
                                    : "bg-white/5 text-foreground border border-white/5 rounded-tl-sm"
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    <div ref={scrollRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-white/5 bg-black/20 shrink-0 backdrop-blur-md">
                    <form onSubmit={handleSubmit} className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="
                                relative
                                h-12
                                bg-black/40 border-white/10 text-foreground 
                                focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50
                                placeholder:text-muted-foreground/70
                                pr-12 pl-4
                                rounded-xl
                                shadow-inner
                                transition-all
                            "
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isProcessing}
                            className="
                                absolute right-1.5 top-1.5 bottom-1.5 h-auto aspect-square
                                bg-primary/20 text-primary hover:bg-primary hover:text-black
                                border border-white/5 transition-all rounded-lg
                                shadow-sm
                            "
                        >
                            <Send className="size-4" />
                        </Button>
                    </form>
                    <div className="mt-3 flex justify-center gap-4 opacity-30 text-[9px] font-mono tracking-[0.2em] uppercase">
                        <span>Secured</span>
                        <span>•</span>
                        <span>V.1.0.4</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
