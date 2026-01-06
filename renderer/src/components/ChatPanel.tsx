import * as React from "react";
import { Send, Bot, MessageSquare, Sparkles, User, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";
import { useAppStore } from "../context/AppContext";

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatPanelProps {
    onSendMessage: (text: string) => void | Promise<void>;
    onClearHistory?: () => void;
}

export function ChatPanel({ onSendMessage, onClearHistory }: ChatPanelProps) {
    const { state, actions } = useAppStore();
    const [input, setInput] = React.useState("");
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = React.useState(false);

    // Auto-scroll
    React.useEffect(() => {
        scrollToBottom();
    }, [state.chatMessages, state.isChatProcessing]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || state.isChatProcessing) return;
        onSendMessage(input);
        setInput("");
    };

    // --- Collapsed View ---
    if (state.isRightCollapsed) {
        return (
            <div className="panel-glass border-l h-full w-full flex flex-col items-center py-4 bg-black/60 backdrop-blur-xl gap-4">
                <Button variant="ghost" size="icon" onClick={actions.toggleRightCollapse} className="size-8 text-muted-foreground hover:text-white">
                    <MessageSquare className="size-4" />
                </Button>

                <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-50">
                    <div className="writing-vertical-rl rotate-180 text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground whitespace-nowrap">
                        Communication Uplink
                    </div>
                </div>

                <div className="mt-auto pb-4">
                    <div className={cn("size-2 rounded-full", state.isChatProcessing ? "bg-accent animate-pulse" : "bg-primary/20")} />
                </div>
            </div>
        );
    }

    // --- Expanded View ---
    return (
        <div className="panel-glass border-l font-sans h-full flex flex-col relative w-full">
            {/* Header */}
            <div className="panel-header shrink-0 z-20 shadow-sm border-b border-white/10 bg-black/40 backdrop-blur-xl pr-2">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white/5 rounded-lg border border-white/5 ring-1 ring-white/5">
                        <Bot className="size-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Athena <span className="text-secondary opacity-60">AI</span></h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={cn("size-1 rounded-full shadow-[0_0_8px_currentColor]", state.isChatProcessing ? "bg-accent animate-pulse" : "bg-primary")} />
                            <span className="text-[8px] text-muted-foreground font-mono uppercase tracking-widest opacity-80">
                                {state.isChatProcessing ? "Thinking..." : "Online"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {/* Clear Button */}
                    {state.chatMessages.length > 1 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                if (confirm("Clear chat history?")) {
                                    onClearHistory?.();
                                }
                            }}
                            className="size-7 text-muted-foreground/40 hover:text-white hover:bg-white/5 rounded-md"
                        >
                            <Trash2 className="size-3.5" />
                        </Button>
                    )}
                    {/* Collapse Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={actions.toggleRightCollapse}
                        className="size-7 text-muted-foreground/40 hover:text-white hover:bg-white/5 rounded-md"
                    >
                        <MessageSquare className="size-3.5" />
                    </Button>
                </div>
            </div>

            {/* Message History */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto min-h-0 p-4 space-y-6 scroll-smooth"
            >
                {state.chatMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center h-full opacity-40 space-y-4 animate-in fade-in duration-700">
                        <div className="p-6 rounded-full bg-linear-to-b from-white/5 to-transparent ring-1 ring-white/10 shadow-2xl">
                            <MessageSquare className="size-8 text-foreground" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium tracking-wide">System Ready</h4>
                            <p className="text-xs font-light text-muted-foreground tracking-wide">
                                Awaiting user input protocol...
                            </p>
                        </div>
                    </div>
                )}

                {state.chatMessages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex flex-col gap-2 max-w-full animate-in slide-in-from-bottom-2 duration-300 fill-mode-backwards group",
                            msg.role === "user" ? "items-end" : "items-start"
                        )}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                        {/* Avatar/Label Row */}
                        <div className={cn(
                            "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity duration-300",
                            msg.role === "user" ? "flex-row-reverse text-secondary/80" : "flex-row text-primary/80"
                        )}>
                            <span>{msg.role === "user" ? "You" : "Athena"}</span>
                            {msg.role === "user" ? <User className="size-3" /> : <Sparkles className="size-3" />}
                        </div>

                        <div className={cn(
                            "rounded-2xl px-5 py-3.5 text-sm leading-relaxed max-w-[90%] break-words shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01]",
                            msg.role === "user"
                                ? "bg-gradient-to-br from-secondary/90 to-purple-600/90 text-white rounded-tr-sm border border-white/20 shadow-purple-900/20"
                                : "bg-white/5 text-foreground border border-white/5 rounded-tl-sm shadow-black/20 hover:bg-white/10"
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {/* Live Transcript */}
                {state.currentTranscript && (
                    <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-primary/20 text-primary-foreground/80 border border-primary/20 rounded-2xl rounded-tr-none px-4 py-3 max-w-[85%] italic">
                            <span className="animate-pulse">{state.currentTranscript}</span> ...
                        </div>
                    </div>
                )}

                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} className="h-px w-full" />
            </div>

            {/* Scroll to bottom button (Floating) */}
            <div className={cn(
                "absolute bottom-24 right-6 transition-all duration-500 transform z-30",
                showScrollButton ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
            )}>
                <Button
                    size="icon"
                    onClick={scrollToBottom}
                    className="h-9 w-9 rounded-full bg-primary/20 hover:bg-primary text-primary hover:text-black border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.3)] backdrop-blur-md transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </Button>
            </div>

            {/* Input Area */}
            <div className="p-4 pt-4 border-t border-white/10 bg-black/40 shrink-0 backdrop-blur-xl z-20">
                <form onSubmit={handleSubmit} className="relative flex gap-2 items-end">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type message..."
                        className="input-glass h-12 flex-1 shadow-inner bg-black/40 border-white/10 focus-visible:ring-primary/40 focus-visible:border-primary/40 font-light tracking-wide transition-all"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || state.isChatProcessing}
                        className={cn(
                            "h-12 w-12 rounded-xl shrink-0 transition-all duration-300 shadow-lg",
                            !input.trim() || state.isChatProcessing
                                ? "bg-white/5 text-muted-foreground border border-white/5"
                                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary),0.4)]"
                        )}
                    >
                        <Send className={cn("size-5 transition-transform", input.trim() && !state.isChatProcessing && "group-hover:translate-x-0.5 group-hover:-translate-y-0.5")} />
                    </Button>
                </form>
                <div className="mt-2.5 flex justify-center gap-3 opacity-20 text-[8px] font-mono tracking-[0.3em] uppercase select-none">
                    <span>Encrypted</span>
                    <span>•</span>
                    <span>Chnnl 1</span>
                    <span>•</span>
                    <span>Active</span>
                </div>
            </div>
        </div >
    );
}
