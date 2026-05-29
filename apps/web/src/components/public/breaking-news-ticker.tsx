"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

interface TickerItem {
  id: string;
  label: string;
  href: string;
}

interface BreakingNewsTickerProps {
  items?: TickerItem[];
}

const DEFAULT_ITEMS: TickerItem[] = [
  {
    id: "1",
    label:
      "Welcome to Pen Times Magazine — Katsina's most trusted source for news and analysis",
    href: "/",
  },
  {
    id: "2",
    label:
      "Stay informed on Nigerian politics, education, and community development",
    href: "/articles",
  },
  {
    id: "3",
    label: "Read the latest stories from across Katsina State and beyond",
    href: "/articles",
  },
  {
    id: "4",
    label: "Check our upcoming programs and events schedule",
    href: "/programs",
  },
];

export function BreakingNewsTicker({
  items = DEFAULT_ITEMS,
}: BreakingNewsTickerProps) {
  const [isPaused, setIsPaused] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Duplicate items for seamless loop
  const allItems = [...items, ...items];

  return (
    <div
      className="bg-ink-900 dark:bg-ink-800 text-white py-1.5 overflow-hidden select-none"
      role="marquee"
      aria-label="Breaking news ticker"
    >
      <div className="flex items-center gap-0">
        {/* Static label */}
        <div className="flex items-center gap-1.5 shrink-0 bg-amber-500 text-ink-900 px-3 py-0.5 z-10">
          <Zap className="h-3 w-3 fill-current" />
          <span className="text-[0.6rem] font-black uppercase tracking-widest whitespace-nowrap">
            Breaking
          </span>
        </div>

        {/* Scrolling content */}
        <div
          className="flex-1 overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
        >
          <div
            ref={tickerRef}
            className="flex whitespace-nowrap"
            style={{
              animation: `ticker-scroll 50s linear infinite`,
              animationPlayState: isPaused ? "paused" : "running",
            }}
          >
            {allItems.map((item, idx) => (
              <span
                key={`${item.id}-${idx}`}
                className="inline-flex items-center"
              >
                <Link
                  href={item.href}
                  className="text-caption text-white/80 hover:text-amber-300 transition-colors px-6 focus:outline-none focus:text-amber-300"
                  tabIndex={0}
                >
                  {item.label}
                </Link>
                <span className="text-amber-500/60 px-1" aria-hidden="true">
                  •
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
