import { useEffect } from "react";

export function useGlobalShortcuts(onShortcut: () => void) {
    useEffect(() => {
        const cleanupShortcut = window.athena?.onShortcutEvent?.(() => {
            console.log("⚡ [useGlobalShortcuts] Shortcut Detected!");
            onShortcut();
        });
        return () => cleanupShortcut?.();
    }, [onShortcut]);
}
