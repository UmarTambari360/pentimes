"use client";

import { useState } from "react";
import Link from "next/link";
import { GraphQLClient } from "graphql-request";
import { toast } from "sonner";
import { Eye, Edit, Trash2, MoreHorizontal, ExternalLink } from "lucide-react";
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
import { AuthorAvatar } from "@/components/ui/author-avatar";
import { formatRelativeDate } from "@/lib/utils";
import type { ArticleCardType } from "@/types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

interface AdminArticlesTableProps {
  articles: ArticleCardType[];
}

export function AdminArticlesTable({
  articles: initialArticles,
}: AdminArticlesTableProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    try {
      const client = getAuthClient();
      await client.request(DELETE_ARTICLE, { id: deleteId });
      setArticles((prev) => prev.filter((a) => a.id !== deleteId));
      toast.success("Article deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete article");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (article: ArticleCardType) => {
    const newStatus = article.status === "published" ? "draft" : "published";
    try {
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
      toast.success(
        `Article ${newStatus === "published" ? "published" : "unpublished"}`,
      );
    } catch {
      toast.error("Failed to update status");
    }
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
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Article</TableHead>
              <TableHead className="hidden md:table-cell">Author</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell">Views</TableHead>
              <TableHead className="hidden lg:table-cell">Date</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((article) => (
              <TableRow key={article.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/articles/${article.slug}`}
                      target="_blank"
                      className="font-medium text-body-sm hover:text-amber-700 transition-colors line-clamp-2 flex items-center gap-1"
                    >
                      {article.title}
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                    </Link>
                    <div className="flex items-center gap-2 sm:hidden">
                      <Badge
                        variant={
                          article.status === "published" ? "published" : "draft"
                        }
                      >
                        {article.status}
                      </Badge>
                    </div>
                    {article.categories.slice(0, 2).map((cat) => (
                      <span
                        key={cat.id}
                        className="text-caption text-muted-foreground"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <AuthorAvatar author={article.author} size="xs" showName />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge
                    variant={
                      article.status === "published" ? "published" : "draft"
                    }
                  >
                    {article.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-body-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    {article.views.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-body-sm text-muted-foreground">
                  {formatRelativeDate(article.createdAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/articles/${article.slug}`}
                          target="_blank"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/articles/${article.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(article)}
                      >
                        {article.status === "published"
                          ? "Unpublish"
                          : "Publish"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteId(article.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
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

      <Dialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The article and all its comments
              will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
