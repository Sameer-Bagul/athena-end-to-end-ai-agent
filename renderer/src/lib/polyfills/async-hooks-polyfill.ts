/**
 * Polyfill for Node.js async_hooks module in the browser
 * This is needed for LangChain/LangGraph to work in the renderer process
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

export class AsyncLocalStorage<T = unknown> {
  private store: Map<string, T> = new Map();
  private currentKey: string | null = null;

  constructor() {
    // Browser-compatible implementation
  }

  run<R>(store: T, callback: (...args: unknown[]) => R, ...args: unknown[]): R {
    const key = Math.random().toString(36);
    this.store.set(key, store);
    const previousKey = this.currentKey;
    this.currentKey = key;
    
    try {
      return callback(...args);
    } finally {
      this.currentKey = previousKey;
      this.store.delete(key);
    }
  }

  getStore(): T | undefined {
    if (this.currentKey === null) {
      return undefined;
    }
    return this.store.get(this.currentKey);
  }

  enterWith(store: T): void {
    const key = Math.random().toString(36);
    this.store.set(key, store);
    this.currentKey = key;
  }

  disable(): void {
    if (this.currentKey !== null) {
      this.store.delete(this.currentKey);
      this.currentKey = null;
    }
  }

  exit<R>(callback: (...args: unknown[]) => R, ...args: unknown[]): R {
    const previousKey = this.currentKey;
    this.currentKey = null;
    
    try {
      return callback(...args);
    } finally {
      this.currentKey = previousKey;
    }
  }
}

// Export other async_hooks APIs as no-ops for compatibility
export function executionAsyncId(): number {
  return 0;
}

export function triggerAsyncId(): number {
  return 0;
}

export class AsyncResource {
  constructor(_type: string) {}
  runInAsyncScope<T>(fn: () => T): T {
    return fn();
  }
}

export default {
  AsyncLocalStorage,
  executionAsyncId,
  triggerAsyncId,
  AsyncResource
};
