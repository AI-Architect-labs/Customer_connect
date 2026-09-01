'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/lib/utils/errors';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback; defaults to a generic reassuring message + retry button. */
  fallback?: (retry: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches render-time errors anywhere in its subtree, logs the real error
 * (never shown to the end user — UI_UX.md §10.3 says system errors should be
 * "a non-technical, reassuring inline message", never a raw stack trace),
 * and renders a fallback UI with a retry action.
 *
 * This complements (does not replace) Next.js's own route-segment `error.tsx`
 * files, which are added once actual routes exist (Sprint 4+). This
 * component is for wrapping specific subtrees anywhere in the app — e.g. a
 * single widget on a dashboard — so one broken piece doesn't take down an
 * entire page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('Render error caught by ErrorBoundary', {
      message: getErrorMessage(error),
      componentStack: errorInfo.componentStack,
    });
  }

  private retry = (): void => {
    this.setState({ hasError: false });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.retry);
      }
      return <DefaultErrorFallback onRetry={this.retry} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-md border border-border bg-muted p-8 text-center"
    >
      <p className="text-base text-foreground">Something went wrong. Please try again.</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Try Again
      </button>
    </div>
  );
}
