// apps/web/src/app/error.tsx
// This is Next.js's root error boundary — catches any unhandled error thrown
// during rendering of any route segment at or below the root layout.
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, pipe to your error monitoring service.
    console.error("[RootError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="border-t-4 border-destructive pt-8 mb-6 max-w-md">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <p className="text-overline font-semibold uppercase tracking-widest text-destructive mb-2">
          Error
        </p>
        <h1 className="font-serif text-headline-xl font-bold mb-3">
          Something went wrong
        </h1>
        <p className="text-body text-muted-foreground mb-2">
          An unexpected error occurred. Our team has been notified.
        </p>
        {error.digest && (
          <p className="text-caption text-muted-foreground font-mono">
            Reference: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="amber" onClick={reset}>
          Try Again
        </Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Go Home
        </Button>
      </div>
    </div>
  );
}
