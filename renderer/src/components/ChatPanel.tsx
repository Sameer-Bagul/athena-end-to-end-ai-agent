import * as React from "react";
import { Send, Bot, MessageSquare, Sparkles, User, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatPanelProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    onClearHistory?: () => void;
    isProcessing: boolean;
}

export function ChatPanel({ messages, onSendMessage, onClearHistory, isProcessing }: ChatPanelProps) {
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
        <div className="panel-glass border-l font-sans">
            {/* Header */}
            <div className="panel-header">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl border border-white/10 shadow-inner">
                        <Bot className="size-5 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                    </div>
                    <div>
                        <h3 className="panel-title">Athena <span className="text-secondary opacity-80">AI</span></h3>
                        <div className="flex items-center gap-2">
                            <span className={cn("size-2 rounded-full shadow-[0_0_8px_currentColor]", isProcessing ? "bg-accent animate-pulse" : "bg-primary")} />
                            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                                {isProcessing ? "Thinking..." : "Online"}
                            </span>
                        </div>
                    </div>
                </div>
                {/* Clear Button */}
                {messages.length > 1 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            if (confirm("Clear chat history?")) {
                                onClearHistory?.();
                            }
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                )}
            </div>

            {/* Message History */}
            <div className="panel-content">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center py-20 opacity-40 space-y-3 h-full">
                        <div className="p-4 rounded-full bg-white/5 mb-2 ring-1 ring-white/10">
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
                            {msg.role === "user" ? <User className="size-3" /> : <Sparkles className="size-3" />}
                        </div>

                        <div className={cn(
                            "rounded-2xl px-5 py-4 text-sm leading-relaxed max-w-[95%] break-words break-all shadow-sm backdrop-blur-sm",
                            msg.role === "user"
                                ? "bg-gradient-to-br from-secondary/80 to-purple-600/80 text-white rounded-tr-sm border border-white/10"
                                : "bg-white/5 text-foreground border border-white/5 rounded-tl-sm shadow-inner"
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/5 bg-black/20 shrink-0 backdrop-blur-md">
                <form onSubmit={handleSubmit} className="relative flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type command..."
                        className="input-glass h-12 flex-1 shadow-sm focus-visible:ring-primary/30"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isProcessing}
                        className="h-12 w-12 btn-primary-glass rounded-xl shrink-0"
                    >
                        <Send className="size-5" />
                    </Button>
                </form>
                <div className="mt-3 flex justify-center gap-4 opacity-30 text-[9px] font-mono tracking-[0.2em] uppercase">
                    <span>Secured</span>
                    <span>•</span>
                    <span>V.2.0.0</span>
                </div>
            </div>
        </div >
    );
}
