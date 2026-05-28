import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="border-t-4 border-amber-500 pt-8 mb-6 max-w-md">
        <p className="text-overline font-semibold uppercase tracking-widest text-amber-600 mb-2">
          404
        </p>
        <h1 className="font-serif text-headline-xl font-bold mb-3">
          Page Not Found
        </h1>
        <p className="text-body text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="amber" asChild>
          <Link href="/">Go Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/search">Search Articles</Link>
        </Button>
      </div>
    </div>
  );
}
