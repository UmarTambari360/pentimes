"use client";

import { useState } from "react";
import { Heart, Bookmark, Share2 } from "lucide-react";
import { GraphQLClient } from "graphql-request";
import { toast } from "sonner";
import { TOGGLE_LIKE, TOGGLE_BOOKMARK } from "@/lib/graphql/queries/articles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

interface ArticleActionsProps {
  articleId: string;
  slug: string;
  title: string;
  initialLiked: boolean;
  initialBookmarked: boolean;
  likeCount: number;
}

export function ArticleActions({
  articleId,
  slug,
  title,
  initialLiked,
  initialBookmarked,
  likeCount,
}: ArticleActionsProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [count, setCount] = useState(likeCount);
  const [likeLoading, setLikeLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const getAuthClient = () => {
    const token = document.cookie
      .split("; ")
      .find((r) => r.startsWith("access_token="))
      ?.split("=")[1];

    return new GraphQLClient(`${API_URL}/graphql`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  const handleLike = async () => {
    const token = document.cookie.includes("access_token=");
    if (!token) {
      toast.error("Please sign in to like articles");
      return;
    }

    setLikeLoading(true);
    try {
      const client = getAuthClient();
      const data = await client.request<{
        toggleLike: { liked: boolean; likeCount: number };
      }>(TOGGLE_LIKE, { articleId });
      setLiked(data.toggleLike.liked);
      setCount(data.toggleLike.likeCount);
      toast.success(data.toggleLike.liked ? "Article liked!" : "Like removed");
    } catch {
      toast.error("Failed to update like");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleBookmark = async () => {
    const token = document.cookie.includes("access_token=");
    if (!token) {
      toast.error("Please sign in to bookmark articles");
      return;
    }

    setBookmarkLoading(true);
    try {
      const client = getAuthClient();
      const data = await client.request<{
        toggleBookmark: { bookmarked: boolean };
      }>(TOGGLE_BOOKMARK, { articleId });
      setBookmarked(data.toggleBookmark.bookmarked);
      toast.success(
        data.toggleBookmark.bookmarked ? "Bookmarked!" : "Bookmark removed",
      );
    } catch {
      toast.error("Failed to update bookmark");
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/articles/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="flex items-center gap-3 py-4 border-y border-border my-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        disabled={likeLoading}
        className={cn(
          "gap-2 rounded-full",
          liked && "text-red-500 hover:text-red-600",
        )}
      >
        <Heart className={cn("h-4 w-4", liked && "fill-current")} />
        <span>{count}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleBookmark}
        disabled={bookmarkLoading}
        className={cn(
          "gap-2 rounded-full",
          bookmarked && "text-amber-600 hover:text-amber-700",
        )}
      >
        <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
        <span>{bookmarked ? "Saved" : "Save"}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        className="gap-2 rounded-full ml-auto"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Share</span>
      </Button>
    </div>
  );
}
