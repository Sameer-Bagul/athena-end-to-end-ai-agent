export const logger = {
    log: (...args: any[]) => {
        // Log to browser console
        console.log(...args);
        // Log to main terminal via Electron IPC
        if ((window as any).athena?.log) {
            (window as any).athena.log(...args);
        }
    },
    error: (...args: any[]) => {
        console.error(...args);
        if ((window as any).athena?.log) {
            (window as any).athena.log("❌ ERROR:", ...args);
        }
    },
    warn: (...args: any[]) => {
        console.warn(...args);
        if ((window as any).athena?.log) {
            (window as any).athena.log("⚠️ WARN:", ...args);
        }
    }
};
