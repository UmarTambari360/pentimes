import { cn } from "@/lib/utils";
import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  variant?: "default" | "rule";
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  href,
  hrefLabel = "View all",
  variant = "rule",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      {variant === "rule" && (
        <div className="border-t-2 border-foreground mb-3" />
      )}
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="font-serif text-headline-lg font-bold text-foreground leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-caption text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="text-caption font-semibold text-amber-700 dark:text-amber-400 hover:underline underline-offset-2 shrink-0"
          >
            {hrefLabel} →
          </Link>
        )}
      </div>
    </div>
  );
}
