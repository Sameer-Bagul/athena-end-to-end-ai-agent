import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error | null; reset: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    
    // Log to error tracking service in production
    if (import.meta.env.MODE === 'production') {
      // TODO: Implement error tracking (e.g., Sentry)
      // trackError(error, errorInfo);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} reset={this.reset} />;
      }

      return <DefaultErrorFallback error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

export function DefaultErrorFallback({ error, reset }: { error: Error | null; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="max-w-md w-full mx-4">
        <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-8 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-12 flex items-center justify-center bg-red-500/10 rounded-full">
              <AlertTriangle className="size-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Something went wrong</h2>
              <p className="text-sm text-white/50">An unexpected error occurred</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-black/30 rounded-lg">
              <p className="text-xs font-mono text-red-300">{error.message}</p>
              {import.meta.env.MODE === 'development' && error.stack && (
                <pre className="mt-2 text-[10px] text-white/30 overflow-x-auto">
                  {error.stack}
                </pre>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="size-4" />
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
            >
              Reload App
            </button>
          </div>

          <p className="mt-4 text-xs text-center text-white/30">
            If the problem persists, please restart the application
          </p>
        </div>
      </div>
    </div>
  );
}
