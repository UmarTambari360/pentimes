"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, Moon, Sun, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/hooks/useAuth";
import { AuthorAvatar } from "@/components/ui/author-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "News", href: "/articles?category=news" },
  { label: "Politics", href: "/articles?category=politics" },
  { label: "Education", href: "/articles?category=education" },
  { label: "Community", href: "/articles?category=community" },
  { label: "Programs", href: "/programs" },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, isAdmin, isAuthor } = useCurrentUser();
  const { logout, loading: loggingOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-editorial border-b border-border"
          : "bg-background border-b border-border",
      )}
    >
      {/* Breaking news ticker */}
      <div className="bg-ink-900 dark:bg-ink-800 text-white py-1.5 overflow-hidden">
        <div className="flex items-center gap-3 px-4">
          <span className="bg-amber-500 text-ink-900 text-[0.6rem] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shrink-0">
            Breaking
          </span>
          <div className="ticker-wrap flex-1">
            <p className="ticker-content text-caption">
              Welcome to Pen Times Magazine — Katsina&apos;s most trusted source
              for news, politics, education, and community development
              &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp; Stay informed, stay
              connected, stay empowered &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
              Welcome to Pen Times Magazine — Katsina&apos;s most trusted source
              for news, politics, education, and community development
              &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp; Stay informed, stay
              connected, stay empowered
            </p>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <div className="max-w-container mx-auto px-4 sm:px-6">
        {/* Masthead */}
        <div className="flex items-center justify-between py-3 border-b border-border/50">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-ink-900 dark:bg-amber-500 rounded-sm flex items-center justify-center">
              <span className="text-white dark:text-ink-900 font-serif font-black text-sm leading-none">
                P
              </span>
            </div>
            <div>
              <span className="font-serif font-black text-xl tracking-tight text-foreground group-hover:text-amber-700 transition-colors">
                Pen Times
              </span>
              <span className="hidden sm:block text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground leading-none mt-0.5">
                Magazine
              </span>
            </div>
          </Link>

          <div className="hidden sm:block text-caption text-muted-foreground text-center">
            <p className="font-medium">Katsina&apos;s Voice</p>
            <p className="text-[0.6rem] uppercase tracking-widest">Est. 2024</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href="/search" aria-label="Search">
                <Search className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <AuthorAvatar author={user} size="sm" />
                    <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-body-sm font-medium">{user.name}</p>
                    <p className="text-caption text-muted-foreground capitalize">
                      {user.role}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  {(isAuthor || isAdmin) && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/articles/new">Write Article</Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={logout}
                    disabled={loggingOut}
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="amber"
                size="sm"
                asChild
                className="hidden sm:flex"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            )}

            <button
              className="sm:hidden p-2 rounded-md hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Desktop nav links */}
        <nav
          className="hidden sm:flex items-center gap-0 h-10"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 h-full flex items-center text-body-sm font-medium transition-colors relative",
                "hover:text-amber-700 dark:hover:text-amber-400",
                pathname.startsWith(link.href.split("?")[0]!)
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-foreground",
                "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500 after:transition-transform after:duration-200",
                pathname.startsWith(link.href.split("?")[0]!)
                  ? "after:scale-x-100"
                  : "after:scale-x-0 hover:after:scale-x-100",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden border-t border-border bg-background overflow-hidden"
          >
            <nav className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-2.5 rounded-md text-body-sm font-medium transition-colors",
                    pathname.startsWith(link.href.split("?")[0]!)
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                      : "hover:bg-muted",
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 mt-2 border-t border-border">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted text-body-sm font-medium"
                    >
                      {user && <AuthorAvatar author={user} size="xs" />}
                      Dashboard
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2.5 rounded-md hover:bg-muted text-body-sm font-medium text-destructive"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex-1"
                    >
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button
                      variant="amber"
                      size="sm"
                      asChild
                      className="flex-1"
                    >
                      <Link href="/register">Register</Link>
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
