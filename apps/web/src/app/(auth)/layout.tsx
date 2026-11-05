import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-4 py-3">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Image
            src="/logo.png"
            alt="Pen Times Magazine"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain"
          />
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
