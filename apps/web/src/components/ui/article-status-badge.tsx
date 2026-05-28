import { Badge } from "./badge";
import { cn } from "@/lib/utils";

interface ArticleStatusBadgeProps {
  status: "draft" | "published";
  className?: string;
}

export function ArticleStatusBadge({
  status,
  className,
}: ArticleStatusBadgeProps) {
  return (
    <Badge
      variant={status === "published" ? "published" : "draft"}
      className={cn("uppercase tracking-wider text-[0.65rem]", className)}
    >
      {status}
    </Badge>
  );
}
