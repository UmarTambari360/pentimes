// apps/web/src/components/ui/error-boundary.tsx
//
// WHY a custom Error Boundary:
//   Next.js app/error.tsx catches errors at the route-segment level. But
//   components deep in the tree (e.g. a widget in a dashboard layout) can
//   throw without crashing the entire segment if wrapped in this boundary.
//   The fallback UI is inline and dismissible so the rest of the page keeps
//   working.

"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback. Receives the error and a reset function. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  /** Additional className on the default fallback container. */
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // In a real deployment you'd send this to Sentry / similar.
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): React.ReactNode {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback(this.state.error, this.handleReset);
    }

    return (
      <DefaultErrorFallback
        error={this.state.error}
        reset={this.handleReset}
        className={this.props.className}
      />
    );
  }
}

// ─── Default inline fallback ───────────────────────────────────────────────
interface DefaultErrorFallbackProps {
  error: Error;
  reset: () => void;
  className?: string;
}

export function DefaultErrorFallback({
  error,
  reset,
  className,
}: DefaultErrorFallbackProps): React.ReactElement {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center",
        className,
      )}
    >
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <div>
        <p className="font-serif font-semibold text-body text-foreground mb-1">
          Something went wrong
        </p>
        <p className="text-body-sm text-muted-foreground max-w-sm">
          {process.env.NODE_ENV === "development"
            ? error.message
            : "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={reset} className="gap-2">
        <RefreshCw className="h-3.5 w-3.5" />
        Try again
      </Button>
    </div>
  );
}

// ─── Convenience wrapper for simpler usage ─────────────────────────────────
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ErrorBoundaryProps["fallback"],
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  Wrapped.displayName = `withErrorBoundary(${Component.displayName ?? Component.name})`;
  return Wrapped;
}
