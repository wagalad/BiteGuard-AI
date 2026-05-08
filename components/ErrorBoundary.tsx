import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public props: Props;
  
  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  public state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errorMessage =
        "The app hit an unexpected problem. Reload and try again. If it keeps happening, check that this deployment has the required environment variables.";

      return (
        <div className="field-panel rounded-[28px] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-apple-danger-bg)] text-[var(--color-apple-danger-text)]">
            <AlertTriangle size={28} />
          </div>
          <h2 className="mt-6 text-[22px] font-extrabold tracking-[-0.03em] text-[var(--color-apple-text)]">
            Something went wrong
          </h2>
          <p className="mx-auto mt-3 max-w-[60ch] text-[14px] leading-6 text-[var(--color-apple-secondary)]">
            {errorMessage}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mx-auto mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-apple-accent)] px-4 text-[13px] font-extrabold text-white hover:bg-[var(--color-apple-accent-hover)] transition-colors"
          >
            <RefreshCw size={18} />
            <span>Reload</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
