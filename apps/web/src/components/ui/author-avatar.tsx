import Link from "next/link";
import Image from "next/image";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AuthorAvatarProps {
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
  size?: "xs" | "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
  linkable?: boolean;
}

const sizeMap = {
  xs: { container: "h-6 w-6", text: "text-[0.6rem]", nameText: "text-caption" },
  sm: { container: "h-8 w-8", text: "text-xs", nameText: "text-caption" },
  md: {
    container: "h-10 w-10",
    text: "text-body-sm",
    nameText: "text-body-sm",
  },
  lg: { container: "h-14 w-14", text: "text-body", nameText: "text-body" },
};

export function AuthorAvatar({
  author,
  size = "sm",
  showName = false,
  className,
  linkable = false,
}: AuthorAvatarProps) {
  const sizes = sizeMap[size];

  const avatar = (
    <div
      className={cn(
        "relative shrink-0 rounded-full overflow-hidden bg-amber-100 dark:bg-amber-900",
        sizes.container,
        className,
      )}
    >
      {author.avatar ? (
        <Image
          src={author.avatar}
          alt={author.name}
          fill
          className="object-cover"
          sizes={size === "lg" ? "56px" : "40px"}
        />
      ) : (
        <span
          className={cn(
            "flex h-full w-full items-center justify-center font-semibold text-amber-800 dark:text-amber-200",
            sizes.text,
          )}
        >
          {getInitials(author.name)}
        </span>
      )}
    </div>
  );

  if (!showName) {
    if (linkable) {
      return (
        <Link
          href={`/author/${author.id}`}
          className="hover:opacity-80 transition-opacity"
        >
          {avatar}
        </Link>
      );
    }
    return avatar;
  }

  const content = (
    <div className="flex items-center gap-2">
      {avatar}
      <span className={cn("font-medium text-foreground", sizes.nameText)}>
        {author.name}
      </span>
    </div>
  );

  if (linkable) {
    return (
      <Link
        href={`/author/${author.id}`}
        className="hover:opacity-80 transition-opacity"
      >
        {content}
      </Link>
    );
  }

  return content;
}
