import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "amber" | "success" | "info";
  className?: string;
}

const variantMap = {
  default: "bg-card border-border",
  amber:
    "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
  success:
    "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
  info: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
};

const iconVariantMap = {
  default: "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  success: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-6 shadow-card",
        variantMap[variant],
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-caption text-muted-foreground font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className="text-headline-xl font-bold font-serif text-foreground tabular-nums">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={cn("rounded-lg p-3", iconVariantMap[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <p
          className={cn(
            "mt-3 text-caption",
            trend.value >= 0 ? "text-green-600" : "text-destructive",
          )}
        >
          <span className="font-semibold">
            {trend.value >= 0 ? "+" : ""}
            {trend.value}%
          </span>{" "}
          <span className="text-muted-foreground">{trend.label}</span>
        </p>
      )}
    </div>
  );
}
