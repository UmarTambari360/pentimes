"use client";

import { useState } from "react";
import Link from "next/link";
import { GraphQLClient } from "graphql-request";
import { toast } from "sonner";
import {
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Globe,
  EyeOff,
  Heart,
  MessageCircle,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DELETE_ARTICLE, UPDATE_ARTICLE } from "@/lib/graphql/queries/articles";
import { formatRelativeDate } from "@/lib/utils";
import type { ArticleCardType } from "@/types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

interface ArticlesTableProps {
  articles: ArticleCardType[];
  userRole: string;
}

export function ArticlesTable({
  articles: initialArticles,
  userRole,
}: ArticlesTableProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const getAuthClient = () => {
    const token = document.cookie
      .split("; ")
      .find((r) => r.startsWith("access_token="))
      ?.split("=")[1];
    return new GraphQLClient(`${API_URL}/graphql`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    const promise = async () => {
      const client = getAuthClient();
      await client.request(DELETE_ARTICLE, { id: deleteId });
      setArticles((prev) => prev.filter((a) => a.id !== deleteId));
      setDeleteId(null);
      setDeleteTitle("");
    };
    toast.promise(promise(), {
      loading: "Deleting article…",
      success: "Article deleted successfully.",
      error: "Failed to delete article. Please try again.",
    });
    setLoading(false);
  };

  const handleToggleStatus = async (article: ArticleCardType) => {
    const newStatus = article.status === "published" ? "draft" : "published";
    setTogglingId(article.id);
    const promise = async () => {
      const client = getAuthClient();
      await client.request(UPDATE_ARTICLE, {
        id: article.id,
        input: { status: newStatus },
      });
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id ? { ...a, status: newStatus } : a,
        ),
      );
    };
    toast.promise(promise(), {
      loading:
        newStatus === "published"
          ? "Publishing article…"
          : "Unpublishing article…",
      success:
        newStatus === "published"
          ? "Article is now live!"
          : "Article moved to drafts.",
      error: "Failed to update status.",
    });
    setTogglingId(null);
  };

  if (articles.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg border-dashed border-border">
        <p className="text-body-sm text-muted-foreground">No articles found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[40%]">Title</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> Views
                </span>
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" /> Likes
                </span>
              </TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="w-10 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((article) => (
              <TableRow
                key={article.id}
                className={
                  togglingId === article.id ? "opacity-60 animate-pulse" : ""
                }
              >
                {/* Title */}
                <TableCell>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <Link
                      href={`/dashboard/articles/${article.id}/edit`}
                      className="font-semibold text-body-sm hover:text-amber-700 dark:hover:text-amber-400 transition-colors line-clamp-2 leading-snug"
                    >
                      {article.title}
                    </Link>
                    {/* Mobile-only meta */}
                    <div className="flex items-center gap-2 sm:hidden flex-wrap">
                      <Badge
                        variant={
                          article.status === "published" ? "published" : "draft"
                        }
                      >
                        {article.status}
                      </Badge>
                      <span className="text-caption text-muted-foreground">
                        {formatRelativeDate(article.createdAt)}
                      </span>
                      <span className="text-caption text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.views.toLocaleString()}
                      </span>
                    </div>
                    {/* Categories */}
                    {article.categories.length > 0 && (
                      <div className="hidden sm:flex gap-1 flex-wrap">
                        {article.categories.slice(0, 2).map((cat) => (
                          <span
                            key={cat.id}
                            className="text-[0.6rem] uppercase tracking-wider bg-muted text-muted-foreground px-1.5 py-0.5 rounded"
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell className="hidden sm:table-cell">
                  <Badge
                    variant={
                      article.status === "published" ? "published" : "draft"
                    }
                  >
                    {article.status}
                  </Badge>
                </TableCell>

                {/* Views */}
                <TableCell className="hidden md:table-cell text-body-sm text-muted-foreground tabular-nums">
                  {article.views.toLocaleString()}
                </TableCell>

                {/* Likes */}
                <TableCell className="hidden lg:table-cell text-body-sm text-muted-foreground tabular-nums">
                  {article.likeCount.toLocaleString()}
                </TableCell>

                {/* Date */}
                <TableCell className="hidden md:table-cell text-body-sm text-muted-foreground whitespace-nowrap">
                  {formatRelativeDate(article.createdAt)}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-8 w-8"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/articles/${article.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View live
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/articles/${article.id}/edit`}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit article
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(article)}
                        disabled={togglingId === article.id}
                        className="flex items-center gap-2"
                      >
                        {article.status === "published" ? (
                          <>
                            <EyeOff className="h-4 w-4" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Globe className="h-4 w-4" />
                            Publish now
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive flex items-center gap-2"
                        onClick={() => {
                          setDeleteId(article.id);
                          setDeleteTitle(article.title);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null);
            setDeleteTitle("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription className="text-body-sm">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                &ldquo;{deleteTitle}&rdquo;
              </span>
              ? This action cannot be undone. All likes, comments, and bookmarks
              associated with this article will also be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteId(null);
                setDeleteTitle("");
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting…" : "Delete Article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
