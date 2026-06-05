"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GraphQLClient } from "graphql-request";
import { ImageUpload } from "../public/image-upload";
import {
  X,
  Loader2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo2,
  Redo2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { CREATE_ARTICLE, UPDATE_ARTICLE } from "@/lib/graphql/queries/articles";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { ArticleFullType, CategoryType } from "@/types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

// Slugify helper
const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Reading time helper
const calcReadingTime = (html: string): number => {
  const text = html.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

const EditorSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(300, "Title cannot exceed 300 characters")
    .trim(),
  excerpt: z
    .string()
    .max(500, "Excerpt cannot exceed 500 characters")
    .trim()
    .optional(),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Lowercase letters, numbers, and hyphens only",
    )
    .max(350, "Slug too long")
    .optional()
    .or(z.literal("")),
  categoryIds: z
    .array(z.string())
    .min(1, "Select at least one category")
    .max(5, "Maximum 5 categories"),
  status: z.enum(["draft", "published"]),
  coverImage: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

type EditorInput = z.infer<typeof EditorSchema>;

interface ArticleEditorProps {
  categories: CategoryType[];
  article?: ArticleFullType;
}

// Tiptap toolbar button
function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "p-1.5 rounded text-body-sm font-medium transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed",
        active
          ? "bg-ink-900 text-white dark:bg-amber-500 dark:text-ink-900"
          : "text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

// Tiptap toolbar
function EditorToolbar({ editor }: { editor: Editor }) {
  const addLink = useCallback(() => {
    const url = window.prompt("Enter URL:");
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap gap-0.5 p-2 border border-border rounded-t-md bg-muted/20 sticky top-0 z-10">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px bg-border mx-1 self-stretch" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px bg-border mx-1 self-stretch" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={addLink}
        active={editor.isActive("link")}
        title="Add link"
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px bg-border mx-1 self-stretch" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>

      {/* Word / reading time counter */}
      <div className="ml-auto flex items-center gap-2 text-caption text-muted-foreground pr-1">
        <span>~{calcReadingTime(editor.getHTML())} min read</span>
      </div>
    </div>
  );
}

export function ArticleEditor({ categories, article }: ArticleEditorProps) {
  const router = useRouter();
  const isEditing = Boolean(article);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<EditorInput>({
    resolver: zodResolver(EditorSchema),
    defaultValues: {
      title: article?.title ?? "",
      excerpt: article?.excerpt ?? "",
      slug: article?.slug ?? "",
      categoryIds: article?.categories.map((c) => c.id) ?? [],
      status: article?.status ?? "draft",
      coverImage: article?.coverImage ?? "",
    },
  });

  const watchTitle = watch("title");
  const watchStatus = watch("status");

  // Auto-generate slug from title when not manually edited
  useEffect(() => {
    if (!slugManuallyEdited && watchTitle) {
      setValue("slug", slugify(watchTitle), { shouldValidate: false });
    }
  }, [watchTitle, slugManuallyEdited, setValue]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Placeholder.configure({
        placeholder:
          "Start writing your article here… Tell your story with clarity and purpose.",
      }),
      Image.configure({ allowBase64: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-amber-600 underline" },
      }),
      Underline,
    ],
    content: article?.content ?? "",
    editorProps: {
      attributes: {
        class:
          "min-h-[400px] max-w-none p-4 outline-none font-sans text-body prose prose-sm dark:prose-invert",
      },
    },
  });

  const getAuthClient = () => {
    const token = document.cookie
      .split("; ")
      .find((r) => r.startsWith("access_token="))
      ?.split("=")[1];
    return new GraphQLClient(`${API_URL}/graphql`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  const onSubmit = async (data: EditorInput) => {
    const content = editor?.getHTML() ?? "";

    if (
      !content ||
      content === "<p></p>" ||
      content.replace(/<[^>]*>/g, "").trim().length < 50
    ) {
      toast.error(
        "Article content is too short. Write at least a few paragraphs.",
      );
      return;
    }

    setSaving(true);

    try {
      const client = getAuthClient();
      const slug = data.slug || slugify(data.title);

      if (isEditing && article) {
        await client.request(UPDATE_ARTICLE, {
          id: article.id,
          input: {
            title: data.title,
            excerpt: data.excerpt || null,
            content,
            coverImage: data.coverImage || null,
            status: data.status,
            categoryIds: data.categoryIds,
            slug,
          },
        });

        toast.success(
          data.status === "published"
            ? "Article updated and live!"
            : "Article saved as draft.",
        );
        router.refresh();
      } else {
        const result = await client.request<{
          createArticle: { slug: string; id: string };
        }>(CREATE_ARTICLE, {
          input: {
            title: data.title,
            excerpt: data.excerpt || null,
            content,
            coverImage: data.coverImage || null,
            status: data.status,
            categoryIds: data.categoryIds,
            slug,
          },
        });

        toast.success(
          data.status === "published"
            ? "Article published successfully!"
            : "Article saved as draft.",
        );
        router.push("/dashboard/articles");
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage.replace("GraphQL Error: ", ""));
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (id: string, current: string[]) => {
    if (current.includes(id)) {
      return current.filter((c) => c !== id);
    }
    if (current.length >= 5) {
      toast.error("Maximum 5 categories allowed");
      return current;
    }
    return [...current, id];
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* ── Title ── */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-body-sm font-semibold">
          Headline <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Write a compelling headline that tells the story…"
          className={cn(
            "text-body font-serif h-12",
            errors.title && "border-destructive",
          )}
          {...register("title")}
        />
        {errors.title && (
          <p className="text-caption text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* ── Slug ── */}
      <div className="space-y-2">
        <Label htmlFor="slug" className="text-body-sm font-semibold">
          URL Slug
          <span className="ml-1.5 text-caption text-muted-foreground font-normal">
            (auto-generated from title)
          </span>
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-caption text-muted-foreground shrink-0 hidden sm:block">
            /articles/
          </span>
          <Input
            id="slug"
            placeholder="article-url-slug"
            className={cn(
              "font-mono text-caption",
              errors.slug && "border-destructive",
            )}
            {...register("slug")}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              register("slug").onChange(e);
            }}
          />
        </div>
        {errors.slug && (
          <p className="text-caption text-destructive">{errors.slug.message}</p>
        )}
        {!slugManuallyEdited && (
          <p className="text-caption text-muted-foreground">
            Slug auto-updates from your title.{" "}
            <button
              type="button"
              className="text-amber-600 hover:underline"
              onClick={() => setSlugManuallyEdited(true)}
            >
              Edit manually
            </button>
          </p>
        )}
      </div>

      {/* ── Excerpt ── */}
      <div className="space-y-2">
        <Label htmlFor="excerpt" className="text-body-sm font-semibold">
          Excerpt
          <span className="ml-1.5 text-caption text-muted-foreground font-normal">
            (shown in listings and SEO — max 500 chars)
          </span>
        </Label>
        <Textarea
          id="excerpt"
          placeholder="A brief, engaging summary of your article. This appears in search results and social shares."
          rows={3}
          maxLength={500}
          className={cn("resize-none", errors.excerpt && "border-destructive")}
          {...register("excerpt")}
        />
        <div className="flex justify-between">
          {errors.excerpt && (
            <p className="text-caption text-destructive">
              {errors.excerpt.message}
            </p>
          )}
          <span className="text-caption text-muted-foreground ml-auto">
            {watch("excerpt")?.length ?? 0}/500
          </span>
        </div>
      </div>

      {/* ── Cover Image ── */}
      <div className="space-y-2">
        <Label className="text-body-sm font-semibold">
          Cover Image
          <span className="ml-1.5 text-caption text-muted-foreground font-normal">
            (JPG, PNG, WebP — max 10MB, recommended 1200×630)
          </span>
        </Label>

        <Controller
          control={control}
          name="coverImage"
          render={({ field }) => (
            <ImageUpload
              endpoint="article-cover"
              value={field.value}
              onChange={field.onChange}
              aspectRatio="video"
              disabled={saving}
              placeholder="Click or drag a cover image here to upload"
            />
          )}
        />
      </div>

      {/* ── Categories ── */}
      <Controller
        control={control}
        name="categoryIds"
        render={({ field }) => (
          <div className="space-y-2">
            <Label className="text-body-sm font-semibold">
              Categories <span className="text-destructive">*</span>
              <span className="ml-1.5 text-caption text-muted-foreground font-normal">
                ({field.value.length}/5 selected)
              </span>
            </Label>
            {categories.length === 0 ? (
              <p className="text-body-sm text-muted-foreground italic">
                No categories available. Ask an admin to create some.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const selected = field.value.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        field.onChange(toggleCategory(cat.id, field.value))
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-md text-caption font-medium border transition-all duration-150",
                        selected
                          ? "bg-amber-500 border-amber-500 text-ink-900 shadow-sm"
                          : "bg-background border-border hover:border-amber-400 text-foreground",
                      )}
                    >
                      {selected && (
                        <span className="mr-1 text-ink-900/70">✓</span>
                      )}
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            )}
            {errors.categoryIds && (
              <p className="text-caption text-destructive">
                {errors.categoryIds.message}
              </p>
            )}
          </div>
        )}
      />

      {/* ── Rich Text Editor ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-body-sm font-semibold">
            Content <span className="text-destructive">*</span>
          </Label>
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-1.5 text-caption text-muted-foreground hover:text-foreground transition-colors"
          >
            {previewMode ? (
              <>
                <EyeOff className="h-3.5 w-3.5" /> Edit
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> Preview
              </>
            )}
          </button>
        </div>

        {editor && !previewMode && <EditorToolbar editor={editor} />}

        {previewMode ? (
          <div
            className="min-h-[400px] p-6 border border-border rounded-md bg-background article-prose"
            dangerouslySetInnerHTML={{
              __html: editor?.getHTML() ?? "<p>Nothing written yet.</p>",
            }}
          />
        ) : (
          <div
            className={cn(
              "border border-border border-t-0 rounded-b-md bg-background min-h-[400px]",
              editor ? "" : "animate-pulse bg-muted",
            )}
          >
            <EditorContent editor={editor} />
          </div>
        )}

        <p className="text-caption text-muted-foreground">
          Tip: Use Heading 2 and Heading 3 for section titles. Blockquotes for
          notable quotes. Links open in the same tab by default.
        </p>
      </div>

      {/* ── Publish settings + Submit ── */}
      <Separator />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        {/* Status toggle */}
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <div className="flex items-center gap-4">
              <Switch
                id="publish-toggle"
                checked={field.value === "published"}
                onCheckedChange={(checked) =>
                  field.onChange(checked ? "published" : "draft")
                }
              />
              <div>
                <Label
                  htmlFor="publish-toggle"
                  className="cursor-pointer font-semibold"
                >
                  {field.value === "published" ? (
                    <span className="text-green-700 dark:text-green-400">
                      Publish immediately
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Save as draft</span>
                  )}
                </Label>
                <p className="text-caption text-muted-foreground">
                  {field.value === "published"
                    ? "Article will be visible to all readers."
                    : "Only you can see this article."}
                </p>
              </div>
            </div>
          )}
        />

        {/* Action buttons */}
        <div className="flex gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="amber"
            disabled={saving}
            className="gap-2 min-w-[140px]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : isEditing ? (
              watchStatus === "published" ? (
                "Update & Publish"
              ) : (
                "Save Changes"
              )
            ) : watchStatus === "published" ? (
              "Publish Article"
            ) : (
              "Save as Draft"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
