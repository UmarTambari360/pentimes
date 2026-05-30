"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Bookmark,
  MessageSquare,
  User,
  PenSquare,
  LogOut,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthorAvatar } from "@/components/ui/author-avatar";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth/session";

const baseLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/articles", icon: FileText, label: "My Articles" },
  { href: "/dashboard/bookmarks", icon: Bookmark, label: "Bookmarks" },
  { href: "/dashboard/comments", icon: MessageSquare, label: "Comments" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
];

interface DashboardSidebarProps {
  className?: string;
  user: SessionUser;
}

export function DashboardSidebar({ className, user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { logout, loading } = useAuth();

  const canWrite = user.role === "author" || user.role === "admin";

  return (
    <aside className={cn("flex flex-col h-full", className)}>
      {/* Brand */}
      <div className="p-4 border-b border-border shrink-0">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-ink-900 dark:bg-amber-500 rounded-sm flex items-center justify-center transition-colors">
            <span className="text-white dark:text-ink-900 font-serif font-black text-xs">
              P
            </span>
          </div>
          <span className="font-serif font-bold text-body text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
            Pen Times
          </span>
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <AuthorAvatar author={user} size="md" />
          <div className="min-w-0">
            <p className="text-body-sm font-semibold truncate">{user.name}</p>
            <p className="text-caption text-muted-foreground capitalize flex items-center gap-1">
              {user.role === "admin" && (
                <Shield className="h-3 w-3 text-amber-500" />
              )}
              {user.role}
            </p>
          </div>
        </div>
      </div>

      {/* Write button — only for authors and admins */}
      {canWrite && (
        <div className="px-3 pt-3 shrink-0">
          <Link
            href="/dashboard/articles/new"
            className="flex items-center justify-center gap-2 w-full h-9 bg-amber-500 hover:bg-amber-600 text-ink-900 font-semibold text-body-sm rounded-md transition-colors"
          >
            <PenSquare className="h-4 w-4" />
            Write Article
          </Link>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground font-semibold px-3 mb-2 mt-1">
          Navigation
        </p>
        <ul className="space-y-0.5">
          {baseLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-body-sm font-medium transition-all duration-150 group relative",
                    isActive
                      ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="dashboard-active-indicator"
                      className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-amber-500 rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}
                  <link.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive
                        ? "text-amber-600"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  <span className="truncate">{link.label}</span>
                  {isActive && (
                    <ChevronRight className="h-3 w-3 ml-auto opacity-40 shrink-0" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Admin shortcut */}
        {user.role === "admin" && (
          <>
            <div className="my-3 border-t border-border" />
            <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground font-semibold px-3 mb-2">
              Admin
            </p>
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-body-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <Shield className="h-4 w-4 shrink-0 text-amber-500" />
              Admin Panel
            </Link>
          </>
        )}
      </nav>

      {/* Footer actions */}
      <div className="p-3 border-t border-border shrink-0 space-y-0.5">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-body-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Site
        </Link>
        <button
          onClick={logout}
          disabled={loading}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-body-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {loading ? "Signing out…" : "Sign Out"}
        </button>
      </div>
    </aside>
  );
}
