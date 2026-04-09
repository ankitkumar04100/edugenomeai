import React from 'react';

interface State { hasError: boolean; error: Error | null; }

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h1 className="font-heading text-xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">{this.state.error?.message}</p>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-heading font-semibold">
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
