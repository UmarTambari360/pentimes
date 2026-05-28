"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="border-t-4 border-destructive pt-8 mb-6 max-w-md">
        <p className="text-overline font-semibold uppercase tracking-widest text-destructive mb-2">
          Error
        </p>
        <h1 className="font-serif text-headline-xl font-bold mb-3">
          Something went wrong
        </h1>
        <p className="text-body text-muted-foreground mb-6">
          An unexpected error occurred. Please try again.
        </p>
      </div>
      <Button variant="amber" onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
