// apps/web/src/app/(public)/articles/[slug]/error.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileX } from "lucide-react";
import Link from "next/link";

export default function ArticleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ArticleError]", error);
  }, [error]);

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-16 text-center">
      <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h1 className="font-serif text-headline-xl font-bold mb-3">
        Could not load article
      </h1>
      <p className="text-body text-muted-foreground mb-6 max-w-md mx-auto">
        There was a problem loading this article. It may have been moved or
        temporarily unavailable.
      </p>
      <div className="flex gap-3 justify-center">
        <Button variant="amber" onClick={reset}>
          Try Again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/articles">All Articles</Link>
        </Button>
      </div>
    </div>
  );
}
