import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary tactical-panel p-6 rounded neon-border">
          <h2 className="text-red-400 font-tactical mb-4">⚠️ SYSTEM ERROR</h2>
          <p className="text-tactical-muted mb-4">
            A critical error occurred in this component. The system is attempting recovery.
          </p>
          <button
            className="bg-neon-400 text-tactical-bg px-4 py-2 rounded font-tactical"
            onClick={() => this.setState({ hasError: false })}
          >
            RETRY COMPONENT
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}