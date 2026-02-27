import * as React from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, MessageSquare, Sparkles, Trash2, Paperclip, FileText, X, ChevronDown } from "lucide-react";
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

    // --- Collapsed View (Floating Icon) ---
    if (state.isRightCollapsed) {
        return (
            <div className="fixed bottom-8 right-8 z-[100]">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button
                        onClick={actions.toggleRightCollapse}
                        className={cn(
                            "size-14 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/20 transition-all duration-300",
                            state.isChatProcessing
                                ? "bg-white text-black"
                                : "bg-black text-white hover:bg-white/10"
                        )}
                    >
                        <AnimatePresence mode="wait">
                            {state.isChatProcessing ? (
                                <motion.div
                                    key="processing"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <Sparkles className="size-6 animate-pulse" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <MessageSquare className="size-6" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Button>
                </motion.div>
            </div>
        );
    }

    // --- Expanded View (Resized Minimalist Monochrome) ---
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full max-h-full flex flex-col relative w-full font-sans bg-black border-l border-white/5 overflow-hidden"
        >
            {/* Minimal Header */}
            <div className="shrink-0 z-20 border-b border-white/5 bg-transparent flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="size-7 flex items-center justify-center bg-white rounded-sm">
                        <Bot className="size-3.5 text-black" />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Athena-01</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <motion.div
                                animate={state.isChatProcessing ? { opacity: [1, 0, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className={cn("size-1 rounded-full", state.isChatProcessing ? "bg-white" : "bg-white/20")}
                            />
                            <span className="text-[7px] text-white/30 font-mono uppercase tracking-[0.1em]">
                                {state.isChatProcessing ? "Busy" : "Ready"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {state.ragStatus.isReady && (
                        <div className="flex items-center gap-2 px-2 py-1 border border-white/10">
                            <FileText className="size-2.5 text-white/40" />
                            <span className="text-[8px] font-mono text-white/60 font-bold">{state.ragStatus.indexedFiles.length}</span>
                            <button onClick={handleClearRag} className="hover:text-white text-white/10 transition-colors">
                                <X className="size-2.5" />
                            </button>
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={actions.toggleRightCollapse}
                        className="size-7 text-white/20 hover:text-white hover:bg-white/5 rounded-none"
                    >
                        <ChevronDown className="size-4 rotate-270" />
                    </Button>
                </div>
            </div>

            {/* Message History */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto min-h-0 p-8 space-y-12 scroll-smooth custom-scrollbar"
            >
                {state.chatMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center h-full opacity-10">
                        <MessageSquare className="size-6 text-white mb-4" />
                        <span className="text-[8px] font-mono tracking-[0.5em] uppercase">Ready for transmission</span>
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {state.chatMessages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={cn(
                                "flex flex-col gap-2 group",
                                msg.role === "user" ? "items-end" : "items-start"
                            )}
                        >
                            <div className={cn(
                                "text-[8px] font-bold uppercase tracking-[0.4em] opacity-20",
                                msg.role === "user" ? "text-right" : "text-left"
                            )}>
                                {msg.role === "user" ? "Client" : "ATH"}
                            </div>

                            <div className={cn(
                                "px-6 py-4 text-[13px] leading-relaxed max-w-[98%] border transition-all duration-300",
                                msg.role === "user"
                                    ? "bg-transparent text-white border-white/10 rounded-[2.5rem] rounded-tr-none"
                                    : "bg-white text-black border-white rounded-[2.5rem] rounded-tl-none font-medium"
                            )}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        ul: (props) => <ul className="list-disc pl-5 space-y-1 my-3" {...props} />,
                                        ol: (props) => <ol className="list-decimal pl-5 space-y-1 my-3" {...props} />,
                                        li: (props) => <li className={msg.role === 'user' ? "text-white/70" : "text-black/80"} {...props} />,
                                        blockquote: (props) => <blockquote className={cn("border-l px-4 my-4 italic", msg.role === 'user' ? "border-white/10 text-white/40" : "border-black/20 text-black/50")} {...props} />,
                                        code: (props) => {
                                            const { children, className, node, ...rest } = props;
                                            const match = /language-(\w+)/.exec(className || '')
                                            return match ? (
                                                <div className={cn("relative my-4 border", msg.role === 'user' ? "border-white/5" : "border-black/5")}>
                                                    <div className={cn("flex items-center justify-between px-3 py-1 border-b", msg.role === 'user' ? "border-white/5 text-white/20" : "border-black/5 text-black/30")}>
                                                        <span className="text-[8px] font-mono uppercase">{match[1]}</span>
                                                    </div>
                                                    <code {...rest} className={cn(className, "block p-4 overflow-x-auto text-[11px] font-mono")}>
                                                        {children}
                                                    </code>
                                                </div>
                                            ) : (
                                                <code {...rest} className={cn("px-1 py-0.5 font-mono text-[11px]", msg.role === 'user' ? "bg-white/5 text-white/60" : "bg-black/5 text-black/70")}>
                                                    {children}
                                                </code>
                                            )
                                        },
                                        pre: (props) => <pre className="bg-transparent p-0 m-0" {...props} />,
                                        p: (props) => <p className="mb-3 last:mb-0" {...props} />,
                                        strong: (props) => <strong className="font-bold" {...props} />,
                                        a: (props) => <a className="underline underline-offset-4 opacity-50 hover:opacity-100 transition-opacity" target="_blank" rel="noopener noreferrer" {...props} />,
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Live Transcript */}
                <AnimatePresence>
                    {state.currentTranscript && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex justify-end pb-2"
                        >
                            <div className="border border-white/5 px-4 py-3 max-w-[90%] text-[12px] font-mono text-white/20">
                                <span className="animate-pulse">_</span> {state.currentTranscript}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={messagesEndRef} className="h-4 w-full" />
            </div>

            {/* Minimal Scroll Button */}
            <AnimatePresence>
                {showScrollButton && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-28 right-8 z-30"
                    >
                        <Button
                            size="icon"
                            onClick={scrollToBottom}
                            className="size-8 rounded-none bg-white text-black hover:bg-white/90 border border-white"
                        >
                            <ChevronDown className="size-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ultra-minimal Input */}
            <div className="p-8 shrink-0 bg-black">
                <form onSubmit={handleSubmit} className="relative">
                    <div className="relative flex items-center border-b border-white/20 focus-within:border-white transition-colors duration-500">
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={handleAttachDocument}
                            className="h-10 w-10 shrink-0 text-white/20 hover:text-white rounded-none"
                        >
                            <Paperclip className="size-3.5" />
                        </Button>

                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="COMM //"
                            className="flex-1 h-12 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-white/10 text-white font-mono text-[12px] px-2"
                        />

                        {onClearHistory && state.chatMessages.length > 0 && (
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => onClearHistory()}
                                className="h-10 w-10 shrink-0 text-white/5 hover:text-white rounded-none"
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        )}

                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || state.isChatProcessing}
                            className={cn(
                                "h-10 w-10 shrink-0 transition-opacity rounded-none",
                                !input.trim() || state.isChatProcessing ? "opacity-0 pointer-events-none" : "opacity-100"
                            )}
                        >
                            <Send className="size-3.5 text-white" />
                        </Button>
                    </div>
                </form>

                <div className="mt-4 flex justify-between px-1 text-[7px] font-mono tracking-[0.2em] uppercase opacity-10 text-white">
                    <span>SECURE LINK</span>
                    <span>V.12</span>
                </div>
            </div>
        </motion.div >
    );
}
