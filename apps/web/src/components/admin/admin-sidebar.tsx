"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Tag,
  Users,
  Calendar,
  MessageSquare,
  LogOut,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AuthorAvatar } from "@/components/ui/author-avatar";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/articles", icon: FileText, label: "Articles" },
  { href: "/admin/categories", icon: Tag, label: "Categories" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/programs", icon: Calendar, label: "Programs" },
  { href: "/admin/comments", icon: MessageSquare, label: "Comments" },
];

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const { logout, loading } = useAuth();

  return (
    <aside className={cn("flex flex-col h-full", className)}>
      {/* Brand */}
      <div className="p-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-ink-900 dark:bg-amber-500 rounded-sm flex items-center justify-center">
            <span className="text-white dark:text-ink-900 font-serif font-black text-xs">
              P
            </span>
          </div>
          <div>
            <span className="font-serif font-bold text-body text-foreground">
              Pen Times
            </span>
            <span className="flex items-center gap-1 text-[0.6rem] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">
              <Shield className="h-2.5 w-2.5" />
              Admin
            </span>
          </div>
        </Link>
      </div>

      {/* User */}
      {user && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <AuthorAvatar author={user} size="sm" />
            <div className="min-w-0">
              <p className="text-body-sm font-semibold truncate">{user.name}</p>
              <p className="text-caption text-amber-600 dark:text-amber-400 font-medium capitalize">
                Administrator
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {adminLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/admin" && pathname.startsWith(link.href));

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-body-sm font-medium transition-all duration-150 relative",
                    isActive
                      ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="admin-active"
                      className="absolute left-0 top-1 bottom-1 w-0.5 bg-amber-500 rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <link.icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-amber-600" : "",
                    )}
                  />
                  {link.label}
                  {isActive && (
                    <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-body-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          Author Dashboard
        </Link>
        <button
          onClick={logout}
          disabled={loading}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-body-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
