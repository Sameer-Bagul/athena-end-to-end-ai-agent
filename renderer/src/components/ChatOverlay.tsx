import * as React from "react";
import { Send, Bot, User, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";
import { ScrollArea } from "./ui/scroll-area";

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
        <div className="fixed top-0 right-0 h-full w-[350px] z-40 p-4 pointer-events-none flex flex-col justify-end">

            {/* Sidebar Container (Pointer events auto enabled on children usually, but let's be safe on parent wrapper) */}
            <div className="
        pointer-events-auto
        flex flex-col h-full w-full
        bg-black/80 backdrop-blur-xl 
        border-l border-cyan-500/30
        shadow-[-10px_0_30px_-10px_var(--color-cyan-900)]
        rounded-l-2xl overflow-hidden
      ">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-cyan-500/20 bg-black/40 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                            <Bot className="size-5 text-cyan-400" />
                        </div>
                        <div>
                            <h3 className="font-mono font-bold text-sm text-cyan-100 tracking-wider">ATHENA AI</h3>
                            <div className="flex items-center gap-2">
                                <span className={cn("size-1.5 rounded-full", isProcessing ? "bg-yellow-400 animate-pulse" : "bg-green-500")} />
                                <span className="text-[10px] text-cyan-500 font-mono uppercase">
                                    {isProcessing ? "Processing..." : "Online"}
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
                            className="h-6 text-[10px] text-cyan-700 hover:text-red-400 hover:bg-red-950/30 tracking-widest"
                        >
                            CLEAR
                        </Button>
                    )}
                </div>

                {/* Message History */}
                <ScrollArea className="flex-1 w-full bg-transparent">
                    <div className="p-4 space-y-6">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center text-center py-10 opacity-50 space-y-2">
                                <MessageSquare className="size-8 text-cyan-800" />
                                <p className="text-cyan-800 text-xs font-mono">
                                    System Ready.
                                </p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "flex flex-col gap-1 max-w-full",
                                    msg.role === "user" ? "items-end" : "items-start"
                                )}
                            >
                                {/* Avatar/Label Row */}
                                <div className={cn(
                                    "flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider opacity-70",
                                    msg.role === "user" ? "flex-row-reverse text-cyan-400" : "flex-row text-cyan-300"
                                )}>
                                    <div className={cn(
                                        "size-5 rounded-full flex items-center justify-center border",
                                        msg.role === "user" ? "border-cyan-700 bg-cyan-950" : "border-cyan-500 bg-cyan-900/30"
                                    )}>
                                        {msg.role === "user" ? <User className="size-3" /> : <Sparkles className="size-3" />}
                                    </div>
                                    <span>{msg.role === "user" ? "User" : "Athena"}</span>
                                </div>

                                {/* Bubble */}
                                <div className={cn(
                                    "rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[95%] break-words whitespace-pre-wrap shadow-lg",
                                    msg.role === "user"
                                        ? "bg-cyan-950 text-cyan-50 border border-cyan-800/50 rounded-tr-none"
                                        : "bg-black/60 text-cyan-100 border border-cyan-500/20 rounded-tl-none shadow-[0_0_15px_-5px_var(--color-cyan-900)]"
                                )}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-cyan-500/20 bg-black/60 shrink-0">
                    <form onSubmit={handleSubmit} className="flex gap-2 relative">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter instructions..."
                            className="
                h-10
                bg-black/50 border-cyan-800/50 text-cyan-100 
                focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500
                placeholder:text-cyan-800/70
                pr-10
                rounded-xl
              "
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isProcessing}
                            className="
                absolute right-1 top-1 bottom-1 h-auto aspect-square
                bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black
                border border-cyan-500/30 transition-all rounded-lg
              "
                        >
                            <Send className="size-4" />
                        </Button>
                    </form>
                    <div className="mt-2 flex justify-center">
                        <span className="text-[9px] text-cyan-900 font-mono uppercase tracking-widest">
                            Secure Connection Est.
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}
