import * as React from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, MessageSquare, Sparkles, User, Trash2, Paperclip, FileText, X } from "lucide-react";
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

    const handleAttachDocument = async () => {
        // @ts-ignore
        if (window.athena?.rag?.uploadDocument) {
            // @ts-ignore
            const result = await window.athena.rag.uploadDocument();
            if (result && !result.canceled && !result.error) {
                actions.refreshRagStatus();
            } else if (result?.error) {
                alert(`Error uploading document: ${result.error}`);
            }
        }
    };

    const handleClearRag = async () => {
        // @ts-ignore
        if (window.athena?.rag?.clear) {
            // @ts-ignore
            await window.athena.rag.clear();
            actions.refreshRagStatus();
        }
    };

    // --- Collapsed View ---
    if (state.isRightCollapsed) {
        return (
            <div
                className={cn(
                    "h-full w-full flex flex-col items-center py-6 gap-8 relative transition-all duration-500 overflow-hidden group",
                    state.isChatProcessing && "shadow-[inset_0_0_50px_rgba(var(--primary),0.1)]"
                )}
                onClick={actions.toggleRightCollapse}
            >
                {/* Active Strip */}
                <div className={cn(
                    "absolute top-0 bottom-0 left-0 w-[1px] transition-all duration-500",
                    state.isChatProcessing ? "bg-primary shadow-[0_0_15px_currentColor]" : "bg-white/5"
                )} />

                {/* Toggle Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); actions.toggleRightCollapse(); }}
                    className="size-10 text-white/40 hover:text-white rounded-xl hover:bg-white/5 transition-all z-10"
                >
                    <MessageSquare className={cn("size-5 transition-transform duration-500", state.isChatProcessing && "animate-pulse text-primary")} />
                </Button>

                {/* Central Status Rail */}
                <div className="flex-1 flex flex-col items-center justify-center gap-12 w-full opacity-40 group-hover:opacity-100 transition-opacity duration-500">

                    {/* Decorative Line Top */}
                    <div className="h-24 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                    {/* Vertical Text */}
                    <div className="writing-vertical-rl rotate-180 flex items-center gap-6">
                        <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/60 whitespace-nowrap group-hover:text-white transition-colors">
                            Neural Link
                        </span>
                        {state.isChatProcessing && (
                            <span className="text-[9px] text-primary animate-pulse font-bold tracking-widest">
                                PROCESSING
                            </span>
                        )}
                    </div>

                    {/* Decorative Line Bottom */}
                    <div className="h-24 w-[1px] bg-gradient-to-t from-transparent via-white/20 to-transparent" />
                </div>

                {/* Bottom Status Indicator */}
                <div className="mt-auto pb-6 flex flex-col items-center gap-4 z-10">
                    <div
                        className={cn(
                            "size-3 rounded-full transition-all duration-500 border border-black/50 shadow-lg",
                            state.isChatProcessing
                                ? "bg-primary shadow-[0_0_15px_rgba(var(--primary),0.6)] animate-pulse"
                                : state.isListening
                                    ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                                    : "bg-white/20"
                        )}
                        title={state.isChatProcessing ? "Processing..." : state.isListening ? "Mic On" : "Idle"}
                    />
                </div>
            </div>
        );
    }

    // --- Expanded View ---
    return (
        <div className="h-full flex flex-col relative w-full font-sans">
            {/* Header */}
            <div className="shrink-0 z-20 border-b border-white/5 bg-white/[0.02] flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/5 rounded-xl border border-white/5 ring-1 ring-white/5 shadow-inner">
                        <Bot className="size-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white/90">Athena <span className="text-white/30 font-light">AI</span></h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={cn("size-1.5 rounded-full shadow-[0_0_8px_currentColor] transition-all duration-500", state.isChatProcessing ? "bg-primary animate-pulse" : "bg-emerald-500/50")} />
                            <span className="text-[9px] text-white/40 font-mono uppercase tracking-widest">
                                {state.isChatProcessing ? "Thinking..." : "Online"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {/* RAG Status */}
                    {state.ragStatus.isReady && (
                        <div className="flex items-center gap-2 mr-2 px-2 py-1 bg-primary/10 border border-primary/20 rounded-lg">
                            <FileText className="size-3 text-primary" />
                            <span className="text-[9px] font-mono text-primary font-bold">{state.ragStatus.indexedFiles.length} DOCS</span>
                            <button onClick={handleClearRag} className="hover:text-red-400 text-white/20 transition-colors">
                                <X className="size-3" />
                            </button>
                        </div>
                    )}
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
                            className="size-8 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                            title="Clear History"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    )}
                    {/* Collapse Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={actions.toggleRightCollapse}
                        className="size-8 text-white/20 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                        <MessageSquare className="size-4" />
                    </Button>
                </div>
            </div>

            {/* Message History */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto min-h-0 p-6 space-y-8 scroll-smooth custom-scrollbar"
            >
                {state.chatMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center h-full opacity-30 space-y-6 animate-in fade-in duration-700">
                        <div className="p-8 rounded-3xl bg-white/[0.03] ring-1 ring-white/5 shadow-2xl backdrop-blur-sm">
                            <MessageSquare className="size-10 text-white" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium tracking-[0.2em] uppercase text-white/60">System Ready</h4>
                            <p className="text-xs font-light text-white/30 tracking-wide">
                                Awaiting user input protocol...
                            </p>
                        </div>
                    </div>
                )}

                {state.chatMessages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex flex-col gap-2 max-w-full group animate-in slide-in-from-bottom-2 duration-500",
                            msg.role === "user" ? "items-end" : "items-start"
                        )}
                    >
                        {/* Avatar/Label Row */}
                        <div className={cn(
                            "flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] opacity-30 group-hover:opacity-80 transition-opacity duration-300 px-1",
                            msg.role === "user" ? "flex-row-reverse text-emerald-400" : "flex-row text-purple-400"
                        )}>
                            <span>{msg.role === "user" ? "You" : "Athena"}</span>
                            {msg.role === "user" ? <User className="size-3" /> : <Sparkles className="size-3" />}
                        </div>

                        <div className={cn(
                            "rounded-2xl px-6 py-4 text-sm leading-relaxed max-w-[90%] break-words shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-2xl",
                            msg.role === "user"
                                ? "bg-white/[0.05] text-white/90 rounded-tr-none border border-white/10"
                                : "bg-black/20 text-white/80 border border-white/5 rounded-tl-none shadow-black/20"
                        )}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    ul: (props) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                                    ol: (props) => <ol className="list-decimal pl-4 space-y-1 my-2" {...props} />,
                                    li: (props) => <li className="mb-1 text-white/80" {...props} />,
                                    blockquote: (props) => <blockquote className="border-l-2 border-white/20 pl-4 py-1 my-2 italic opacity-70 bg-white/5 rounded-r" {...props} />,
                                    code: (props) => {
                                        const { children, className, node, ...rest } = props;
                                        const match = /language-(\w+)/.exec(className || '')
                                        return match ? (
                                            <div className="relative my-3 rounded-lg overflow-hidden border border-white/10 bg-black/40 shadow-inner">
                                                <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5">
                                                    <span className="text-[10px] uppercase tracking-wider text-white/40">{match[1]}</span>
                                                </div>
                                                <code {...rest} className={cn(className, "block p-3 overflow-x-auto text-xs font-mono text-white/80")}>
                                                    {children}
                                                </code>
                                            </div>
                                        ) : (
                                            <code {...rest} className="bg-white/10 rounded px-1.5 py-0.5 font-mono text-[11px] text-emerald-300/80">
                                                {children}
                                            </code>
                                        )
                                    },
                                    pre: (props) => <pre className="bg-transparent p-0 m-0" {...props} />,
                                    p: (props) => <p className="mb-2 last:mb-0" {...props} />,
                                    a: (props) => <a className="text-purple-400 hover:text-purple-300 hover:underline underline-offset-4" target="_blank" rel="noopener noreferrer" {...props} />,
                                }}
                            >
                                {msg.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                ))}

                {/* Live Transcript */}
                {state.currentTranscript && (
                    <div className="flex justify-end animate-in fade-in slide-in-from-bottom-4 duration-300 pb-4">
                        <div className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-2xl rounded-tr-none px-6 py-4 max-w-[85%] italic backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                            <span className="animate-pulse">{state.currentTranscript}</span> ...
                        </div>
                    </div>
                )}

                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} className="h-px w-full" />
            </div>

            {/* Scroll to bottom button (Floating) */}
            <div className={cn(
                "absolute bottom-28 right-8 transition-all duration-500 transform z-30",
                showScrollButton ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
            )}>
                <Button
                    size="icon"
                    onClick={scrollToBottom}
                    className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-lg backdrop-blur-md transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </Button>
            </div>

            {/* Input Area */}
            <div className="p-6 pt-2 pb-6 shrink-0 z-50 bg-gradient-to-t from-black/20 to-transparent">
                <form onSubmit={handleSubmit} className="relative flex gap-3 items-end p-2 rounded-[2rem] bg-white/[0.04] border border-white/10 backdrop-blur-2xl shadow-2xl ring-1 ring-black/20">
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={handleAttachDocument}
                        className="h-10 w-10 rounded-full shrink-0 text-white/30 hover:text-white hover:bg-white/5 my-auto ml-1"
                        title="Attach Document (PDF, TXT, MD)"
                    >
                        <Paperclip className="size-4" />
                    </Button>
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={state.ragStatus.isReady ? "Ask about your documents..." : "Type encrypted message..."}
                        className="flex-1 h-12 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-white/20 text-white/90 font-light tracking-wide px-2"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || state.isChatProcessing}
                        className={cn(
                            "h-10 w-10 rounded-full shrink-0 transition-all duration-300 my-auto mr-1",
                            !input.trim() || state.isChatProcessing
                                ? "bg-white/5 text-white/20"
                                : "bg-white/10 text-white hover:bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                        )}
                    >
                        <Send className={cn("size-4 transition-transform", input.trim() && !state.isChatProcessing && "group-hover:translate-x-0.5 group-hover:-translate-y-0.5")} />
                    </Button>
                </form>
                <div className="mt-3 flex justify-center gap-4 opacity-30 text-[9px] font-mono tracking-[0.3em] uppercase select-none text-white/60">
                    <span>Encrypted Link</span>
                    <span>•</span>
                    <span>Athena Core</span>
                </div>
            </div>
        </div >
    );
}
