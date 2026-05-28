import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-4 py-3">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-7 h-7 bg-ink-900 dark:bg-amber-500 rounded-sm flex items-center justify-center">
            <span className="text-white dark:text-ink-900 font-serif font-black text-xs">
              P
            </span>
          </div>
          <span className="font-serif font-bold text-body text-foreground">
            Pen Times
          </span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
      <footer className="border-t border-border px-4 py-3 text-center">
        <p className="text-caption text-muted-foreground">
          © {new Date().getFullYear()} Pen Times Magazine. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
