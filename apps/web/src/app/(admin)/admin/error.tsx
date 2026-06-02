// apps/web/src/app/(admin)/admin/error.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AdminError]", error);
  }, [error]);

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-12 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <div>
          <h2 className="font-serif font-bold text-headline mb-2">
            Admin panel error
          </h2>
          <p className="text-body-sm text-muted-foreground max-w-sm mb-1">
            Something went wrong. Please try again or contact support.
          </p>
          {error.digest && (
            <p className="text-caption text-muted-foreground font-mono">
              Ref: {error.digest}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="amber" size="sm" onClick={reset} className="gap-2">
            <RotateCcw className="h-3.5 w-3.5" />
            Try again
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">Admin home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
