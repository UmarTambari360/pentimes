import Link from "next/link";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  name: string;
  slug: string;
  className?: string;
  interactive?: boolean;
}

export function CategoryBadge({
  name,
  slug,
  className,
  interactive = true,
}: CategoryBadgeProps) {
  const classes = cn(
    "inline-block text-overline font-semibold uppercase tracking-widest px-2.5 py-1",
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    "rounded-sm transition-colors duration-150",
    interactive &&
      "hover:bg-amber-200 dark:hover:bg-amber-900/50 cursor-pointer",
    className,
  );

  if (!interactive) {
    return <span className={classes}>{name}</span>;
  }

  return (
    <Link href={`/category/${slug}`} className={classes}>
      {name}
    </Link>
  );
}
