import * as React from "react";
import { Globe, RefreshCw, X, Play, AlertCircle, Maximize2 } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { logger } from "../lib/logger";

interface BrowserStreamPanelProps {
    isOpen: boolean;
    onClose: () => void;
    wsUrl?: string; // e.g. ws://localhost:3000/stream
}

export function BrowserStreamPanel({ isOpen, onClose, wsUrl = "ws://127.0.0.1:3000/stream" }: BrowserStreamPanelProps) {
    const [status, setStatus] = React.useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [snapshotUrl, setSnapshotUrl] = React.useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const wsRef = React.useRef<WebSocket | null>(null);

    const connectWebSocket = React.useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
        }

        setStatus('connecting');
        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setStatus('connected');
                logger.info("[BrowserStream] WebSocket connected");
            };

            ws.onmessage = (event) => {
                // Agent Browser typically sends base64 image data or JSON containing it
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'snapshot' && data.image) {
                        setSnapshotUrl(`data:image/jpeg;base64,${data.image}`);
                    }
                } catch {
                    // Fallback if raw image string is sent
                    if (typeof event.data === 'string' && event.data.length > 100) {
                        setSnapshotUrl(`data:image/jpeg;base64,${event.data}`);
                    }
                }
            };

            ws.onclose = () => {
                setStatus('disconnected');
                logger.info("[BrowserStream] WebSocket disconnected");
            };

            ws.onerror = (error) => {
                logger.error("[BrowserStream] WebSocket error:", error);
                setStatus('disconnected');
            };
        } catch (error) {
            logger.error("[BrowserStream] Connection failed:", error);
            setStatus('disconnected');
        }
    }, [wsUrl]);

    const [hitlRequest, setHitlRequest] = React.useState<{ id: string; message: string } | null>(null);

    React.useEffect(() => {
        if (isOpen && status === 'disconnected') {
            connectWebSocket();
        }
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [isOpen, connectWebSocket, status]);

    React.useEffect(() => {
        const removeListener = (window as any).ipcRenderer?.on("agent:hitl-request-ui", (data: any) => {
            logger.info("[BrowserStream] HITL Request received:", data);
            setHitlRequest(data);
        });
        return () => removeListener?.();
    }, []);

    const handleHitlResponse = (approved: boolean) => {
        if (!hitlRequest) return;
        (window as any).ipcRenderer?.send("agent:hitl-response-ui", {
            id: hitlRequest.id,
            approved
        });
        setHitlRequest(null);
    };

    if (!isOpen) return null;

    return (
        <div className={cn(
            "fixed z-40 bg-[#09090b]/95 backdrop-blur-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden transition-all duration-300",
            isFullscreen ? "inset-0 rounded-none" : "bottom-6 right-6 w-[600px] h-[400px] rounded-2xl"
        )}>
            {/* Header */}
            <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 shrink-0 bg-white/5">
                <div className="flex items-center gap-3">
                    <Globe className={cn("size-4", status === 'connected' ? "text-green-400" : "text-white/40")} />
                    <span className="text-sm font-medium text-white tracking-wide">Agent Browser Stream</span>
                    <div className="flex items-center gap-1.5 ml-2">
                        <div className={cn("size-2 rounded-full", 
                            status === 'connected' ? "bg-green-400 shadow-[0_0_10px_#4ade80]" : 
                            status === 'connecting' ? "bg-yellow-400 animate-pulse" : "bg-red-400"
                        )} />
                        <span className="text-[10px] text-white/50 uppercase font-mono">
                            {status}
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={connectWebSocket}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                        title="Reconnect"
                    >
                        <RefreshCw className={cn("size-4", status === 'connecting' && "animate-spin")} />
                    </button>
                    <button 
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                        title="Toggle Fullscreen"
                    >
                        <Maximize2 className="size-4" />
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative bg-black/50 flex items-center justify-center p-4">
                {status === 'connected' && snapshotUrl ? (
                    <img 
                        src={snapshotUrl} 
                        alt="Browser Stream" 
                        className="w-full h-full object-contain rounded-lg border border-white/5 shadow-2xl"
                    />
                ) : status === 'connecting' ? (
                    <div className="flex flex-col items-center gap-4 text-white/40">
                        <RefreshCw className="size-8 animate-spin" />
                        <span className="text-xs font-mono tracking-widest uppercase">Establishing Connection...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 text-white/30">
                        <AlertCircle className="size-8" />
                        <span className="text-xs font-mono tracking-widest uppercase">Stream Offline</span>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={connectWebSocket}
                            className="mt-2 border-white/10 hover:bg-white/10"
                        >
                            <Play className="size-3 mr-2" /> Start Stream
                        </Button>
                    </div>
                )}
                
                {/* Overlay UI for HITL or Logs could go here */}
                {status === 'connected' && !hitlRequest && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                        <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] font-mono text-white/80 uppercase tracking-wider">Live View Active</span>
                    </div>
                )}

                {/* HITL Request Overlay */}
                {hitlRequest && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in z-50">
                        <div className="bg-[#09090b] border border-yellow-500/30 shadow-2xl rounded-2xl max-w-md w-full overflow-hidden flex flex-col">
                            <div className="bg-yellow-500/10 p-4 border-b border-yellow-500/20 flex items-center gap-3">
                                <AlertCircle className="size-5 text-yellow-400" />
                                <h3 className="text-sm font-semibold text-yellow-50">Action Requires Approval</h3>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-white/80 leading-relaxed">
                                    {hitlRequest.message || "The AI agent wants to perform an action that requires your explicit approval."}
                                </p>
                            </div>
                            <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-end gap-3">
                                <Button 
                                    variant="outline" 
                                    className="border-white/10 hover:bg-white/10 hover:text-white transition-colors"
                                    onClick={() => handleHitlResponse(false)}
                                >
                                    Deny
                                </Button>
                                <Button 
                                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold transition-colors shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_20px_rgba(234,179,8,0.5)]"
                                    onClick={() => handleHitlResponse(true)}
                                >
                                    Approve Action
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
