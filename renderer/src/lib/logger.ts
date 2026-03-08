export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

class Logger {
    private level: LogLevel;

    constructor() {
        this.level = import.meta.env.MODE === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
    }

    setLevel(level: LogLevel) {
        this.level = level;
    }

    debug(...args: any[]) {
        if (this.level <= LogLevel.DEBUG) {
            console.debug('[DEBUG]', ...args);
            if ((window as any).athena?.log) {
                (window as any).athena.log('[DEBUG]', ...args);
            }
        }
    }

    log(...args: any[]) {
        if (this.level <= LogLevel.INFO) {
            console.log(...args);
            if ((window as any).athena?.log) {
                (window as any).athena.log(...args);
            }
        }
    }

    info(...args: any[]) {
        if (this.level <= LogLevel.INFO) {
            console.info('[INFO]', ...args);
            if ((window as any).athena?.log) {
                (window as any).athena.log('[INFO]', ...args);
            }
        }
    }

    warn(...args: any[]) {
        if (this.level <= LogLevel.WARN) {
            console.warn(...args);
            if ((window as any).athena?.log) {
                (window as any).athena.log("⚠️ WARN:", ...args);
            }
        }
    }

    error(...args: any[]) {
        console.error(...args);
        if ((window as any).athena?.log) {
            (window as any).athena.log("❌ ERROR:", ...args);
        }
    }

    /**
     * Log performance metrics
     */
    logPerformance(metric: string, duration: number) {
        if (this.level <= LogLevel.INFO) {
            console.log(`[PERF] ${metric}: ${duration.toFixed(2)}ms`);
        }
    }

    /**
     * Create a timer for measuring performance
     */
    startTimer(label: string): () => void {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            this.logPerformance(label, duration);
        };
    }
}

export const logger = new Logger();
