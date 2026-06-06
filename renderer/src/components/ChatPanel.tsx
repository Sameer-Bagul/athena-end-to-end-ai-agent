import * as React from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, MessageSquare, Sparkles, Trash2, Paperclip, FileText, X, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";
import { useAppStore } from "../context/AppContext";
import { useVirtualizer } from '@tanstack/react-virtual';

export interface Attachment {
    name: string;
    type: string;
    path?: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    attachments?: Attachment[];
    usedTools?: string[];
}

interface ChatPanelProps {
    onSendMessage: (text: string) => void | Promise<void>;
    onClearHistory?: () => void;
}

export const ChatPanel = React.memo(function ChatPanel({ onSendMessage, onClearHistory }: ChatPanelProps) {
    const actions = useAppStore(s => s.actions);
    const chatMessages = useAppStore(s => s.state.chatMessages);
    const isChatProcessing = useAppStore(s => s.state.isChatProcessing);
    const isRightCollapsed = useAppStore(s => s.state.isRightCollapsed);
    const selectedCharacterName = useAppStore(s => s.state.selectedCharacter.name);
    const currentAnimation = useAppStore(s => s.state.currentAnimation);
    const ragStatus = useAppStore(s => s.state.ragStatus);
    const currentTranscript = useAppStore(s => s.state.currentTranscript);

    const [input, setInput] = React.useState("");
    const [localAttachments, setLocalAttachments] = React.useState<Attachment[]>([]);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = React.useState(false);

    // Virtualization
    const rowVirtualizer = useVirtualizer({
        count: chatMessages.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 100, // Estimated pixel height per message
        overscan: 5,
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Auto-scroll
    React.useEffect(() => {
        scrollToBottom();
    }, [chatMessages.length, isChatProcessing]);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((!input.trim() && localAttachments.length === 0) || isChatProcessing) return;

        // Match expected signature in App.tsx/useAssistant
        // @ts-ignore
        onSendMessage(input, localAttachments);

        setInput("");
        setLocalAttachments([]);
    };

    const handleAttachDocument = async () => {
        // @ts-expect-error - athena global not typed
        if (window.athena?.rag?.uploadDocument) {
            // @ts-expect-error - athena global not typed
            const result = await window.athena.rag.uploadDocument();
            if (result && !result.canceled && !result.error) {
                // Add to local state for display in message
                const newAttachment: Attachment = {
                    name: result.name || "Document",
                    type: result.type || "file",
                    path: result.path
                };
                setLocalAttachments(prev => [...prev, newAttachment]);
                actions.refreshRagStatus();
            } else if (result?.error) {
                alert(`Error uploading document: ${result.error}`);
            }
        }
    };

    const removeAttachment = (idx: number) => {
        setLocalAttachments(prev => prev.filter((_, i) => i !== idx));
    };

    const handleClearRag = async () => {
        // @ts-expect-error - athena global not typed
        if (window.athena?.rag?.clear) {
            // @ts-expect-error - athena global not typed
            await window.athena.rag.clear();
            actions.refreshRagStatus();
        }
    };

    // --- Collapsed View (Floating Icon) ---
    if (isRightCollapsed) {
        return (
            <div className="fixed bottom-8 right-8 z-100">
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
                            isChatProcessing
                                ? "bg-white text-black"
                                : "bg-black text-white hover:bg-white/10"
                        )}
                    >
                        <AnimatePresence mode="wait">
                            {isChatProcessing ? (
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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full max-h-full flex flex-col relative w-full font-sans bg-[#050505] border-l border-white/5 overflow-hidden"
        >
            {/* Full Panel Doodle Background */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.3] mix-blend-screen z-0"
                style={{
                    backgroundImage: `url('doodle.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            />

            {/* Minimal Header */}
            <div className="shrink-0 z-20 border-b border-white/3 bg-transparent flex items-center justify-between px-6 py-4 h-16">
                <div className="flex items-center gap-3">
                    <div className="size-6 flex items-center justify-center bg-white/5 border border-white/10 rounded-full">
                        <Bot className="size-3 text-white/40" />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-[13px] font-semibold text-white/90">{selectedCharacterName}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <motion.div
                                animate={isChatProcessing ? { opacity: [1, 0, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className={cn("size-1 rounded-full", isChatProcessing ? "bg-primary" : "bg-white/20")}
                            />
                            <span className="text-[10px] text-white/40 font-medium tracking-tight">
                                {isChatProcessing ? "Processing" : currentAnimation}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {ragStatus.isReady && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-white/2 border border-white/5 rounded-md">
                            <FileText className="size-2.5 text-white/20" />
                            <span className="text-[8px] font-mono text-white/40">{ragStatus.indexedFiles.length}</span>
                            <button onClick={handleClearRag} className="hover:text-white text-white/10 transition-colors">
                                <X className="size-2.5" />
                            </button>
                        </div>
                    )}

                    <button
                        onClick={actions.toggleRightCollapse}
                        className="text-white/20 hover:text-white transition-colors"
                    >
                        <ChevronDown className="size-4 rotate-270" />
                    </button>
                </div>
            </div>

            {/* Message History */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto min-h-0 p-8 space-y-12 scroll-smooth custom-scrollbar relative z-10"
            >
                {chatMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center h-full opacity-10">
                        <MessageSquare className="size-6 text-white mb-4" />
                        <span className="text-[8px] font-mono tracking-[0.5em] uppercase text-white">Ready for transmission</span>
                    </div>
                )}

                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const msg = chatMessages[virtualRow.index];
                        return (
                            <div
                                key={virtualRow.index}
                                data-index={virtualRow.index}
                                ref={rowVirtualizer.measureElement}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    transform: `translateY(${virtualRow.start}px)`,
                                    paddingBottom: '48px', // Space between messages
                                }}
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex flex-col gap-1.5 group",
                                        msg.role === "user" ? "items-end" : "items-start"
                                    )}
                                >
                                    <div className={cn(
                                        "text-[8px] font-medium text-white transition-opacity",
                                        msg.role === "user" ? "text-right opacity-60" : "text-left opacity-60 group-hover:opacity-100"
                                    )}>
                                        {msg.role === "user" ? "You" : selectedCharacterName}
                                    </div>

                            <div className={cn(
                                "px-5 py-3.5 text-[13px] leading-relaxed max-w-[92%] transition-all duration-300 relative z-10",
                                msg.role === "user"
                                    ? "bg-white/5 text-white/95 border border-white/10 rounded-2xl rounded-tr-none backdrop-blur-md"
                                    : "bg-white text-black border border-white rounded-2xl rounded-tl-none font-medium shadow-[0_10px_40px_rgba(255,255,255,0.15)]"
                            )}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        ul: (props) => <ul className="list-disc pl-5 space-y-1 my-3" {...props} />,
                                        ol: (props) => <ol className="list-decimal pl-5 space-y-1 my-3" {...props} />,
                                        li: (props) => <li className={msg.role === 'user' ? "text-white/80" : "text-black/80"} {...props} />,
                                        blockquote: (props) => <blockquote className={cn("border-l-2 px-4 my-4 italic", msg.role === 'user' ? "border-white/20 text-white/60" : "border-black/20 text-black/50")} {...props} />,
                                        code: (props) => {
                                            const { children, className, ...rest } = props;
                                            const match = /language-(\w+)/.exec(className || '')
                                            return match ? (
                                                <div className={cn("relative my-4 border rounded-lg overflow-hidden", msg.role === 'user' ? "border-white/10" : "border-black/5")}>
                                                    <div className={cn("flex items-center justify-between px-3 py-1.5 border-b", msg.role === 'user' ? "border-white/10 text-white/40 bg-white/5" : "border-black/5 text-black/30 bg-black/2")}>
                                                        <span className="text-[8px] font-mono uppercase">{match[1]}</span>
                                                    </div>
                                                    <code {...rest} className={cn(className, "block p-4 overflow-x-auto text-[11px] font-mono")}>
                                                        {children}
                                                    </code>
                                                </div>
                                            ) : (
                                                <code {...rest} className={cn("px-1.5 py-0.5 font-mono text-[11px] rounded-md", msg.role === 'user' ? "bg-white/10 text-white/80" : "bg-black/5 text-black/70")}>
                                                    {children}
                                                </code>
                                            )
                                        },
                                        pre: (props) => <pre className="bg-transparent p-0 m-0" {...props} />,
                                        p: (props) => <p className="mb-3 last:mb-0" {...props} />,
                                        strong: (props) => <strong className="font-semibold" {...props} />,
                                        a: (props) => <a className={cn("underline underline-offset-4 transition-opacity", msg.role === 'user' ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black")} target="_blank" rel="noopener noreferrer" {...props} />,
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>

                                {/* Attachments Display */}
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className={cn("mt-4 pt-3 border-t flex flex-wrap gap-2", msg.role === 'user' ? "border-white/10" : "border-black/5")}>
                                        {msg.attachments.map((file, fIdx) => (
                                            <div key={fIdx} className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg border max-w-full overflow-hidden", msg.role === 'user' ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5")}>
                                                <div className={cn("p-1 rounded", msg.role === 'user' ? "bg-white/10" : "bg-black/10")}>
                                                    <FileText className={cn("size-3", msg.role === 'user' ? "text-white/80" : "text-black/80")} />
                                                </div>
                                                <span className={cn("text-[10px] truncate", msg.role === 'user' ? "text-white/80" : "text-black/80")}>
                                                    {file.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Tool Usage Display */}
                                {msg.role === 'assistant' && msg.usedTools && msg.usedTools.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-black/5 flex flex-wrap gap-2 items-center">
                                        <Sparkles className="size-2.5 text-black/30" />
                                        <span className="text-[9px] font-mono text-black/40 uppercase tracking-wider">Executed:</span>
                                        {msg.usedTools.map((tool, tIdx) => (
                                            <div key={tIdx} className="px-2 py-0.5 bg-black/5 border border-black/5 rounded-full text-[9px] font-mono text-black/60">
                                                {tool}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                    );
                })}
                </div>

                {/* Live Transcript */}
                <AnimatePresence>
                    {currentTranscript && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex justify-end pb-2"
                        >
                            <div className="border border-white/10 bg-white/5 px-4 py-3 max-w-[90%] text-[12px] font-mono text-white/40 rounded-xl backdrop-blur-sm">
                                <span className="animate-pulse">_</span> {currentTranscript}
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
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-32 right-8 z-30"
                    >
                        <button
                            onClick={scrollToBottom}
                            className="size-8 flex items-center justify-center rounded-full bg-white text-black hover:bg-white/90 border border-white shadow-lg transition-all"
                        >
                            <ChevronDown className="size-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-6 pb-8 shrink-0 bg-transparent border-t border-white/5 relative z-20 backdrop-blur-md">
                <form onSubmit={handleSubmit} className="relative flex flex-col gap-3">
                    {/* Attachment Previews */}
                    <AnimatePresence>
                        {localAttachments.length > 0 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="flex flex-wrap gap-2 mb-1 px-1 overflow-hidden"
                            >
                                {localAttachments.map((file, idx) => (
                                    <div key={idx} className="group relative flex items-center gap-2 pl-2 pr-1 py-1 px-1 bg-white/10 border border-white/20 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 backdrop-blur-md">
                                        <div className="p-1 px-1.5 bg-white/10 rounded-lg">
                                            <FileText className="size-3 text-white/60" />
                                        </div>
                                        <span className="text-[10px] text-white/80 max-w-[120px] truncate">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(idx)}
                                            className="p-1 text-white/40 hover:text-white transition-colors"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className={cn(
                        "relative flex items-center bg-white/10 border backdrop-blur-xl transition-all duration-500 rounded-3xl overflow-hidden px-2 py-1",
                        isChatProcessing ? "border-white/5 opacity-50" : "border-white/20 hover:border-white/40 focus-within:border-white/50 focus-within:bg-white/15 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                    )}>
                        <button
                            type="button"
                            onClick={handleAttachDocument}
                            disabled={isChatProcessing}
                            className="h-10 w-10 shrink-0 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                        >
                            <Paperclip className="size-4" />
                        </button>

                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isChatProcessing ? "Athena is typing..." : "Talk to me..."}
                            disabled={isChatProcessing}
                            className="flex-1 h-12 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-white/20 text-[14px] text-white font-medium px-3 selection:bg-white/20"
                        />

                        <div className="flex items-center gap-1 pr-1">
                            {onClearHistory && chatMessages.length > 0 && !input.trim() && localAttachments.length === 0 && (
                                <button
                                    type="button"
                                    onClick={() => onClearHistory()}
                                    className="h-10 w-10 shrink-0 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            )}

                            <button
                                type="submit"
                                disabled={(!input.trim() && localAttachments.length === 0) || isChatProcessing}
                                className={cn(
                                    "h-10 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all font-bold text-[13px] tracking-tight",
                                    (!input.trim() && localAttachments.length === 0) || isChatProcessing
                                        ? "bg-white/5 text-white/10"
                                        : "bg-white text-black hover:bg-white/90 active:scale-95 shadow-[0_0_25px_rgba(255,255,255,0.15)]"
                                )}
                            >
                                <span className={cn(input.trim() || localAttachments.length > 0 ? "inline" : "hidden")}>Send</span>
                                <Send className="size-3.5" />
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </motion.div>
    );
});
