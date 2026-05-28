'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GraphQLClient } from 'graphql-request';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { CREATE_ARTICLE, UPDATE_ARTICLE } from '@/lib/graphql/queries/articles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ArticleFullType, CategoryType } from '@/types';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

const slugify = (text: string): string =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const EditorSchema = z.object({
  title:       z.string().min(5, 'Title must be at least 5 characters').max(300),
  excerpt:     z.string().max(500).optional(),
  slug:        z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters and hyphens only').optional(),
  categoryIds: z.array(z.string()).min(1, 'Select at least one category'),
  status:      z.enum(['draft', 'published']),
  coverImage:  z.string().url().optional().or(z.literal('')),
});

type EditorInput = z.infer<typeof EditorSchema>;

interface ArticleEditorProps {
  categories: CategoryType[];
  article?: ArticleFullType;
}

export function ArticleEditor({ categories, article }: ArticleEditorProps) {
  const router = useRouter();
  const [saving, setSaving]           = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [coverPreview, setCoverPreview]     = useState(article?.coverImage ?? '');

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<EditorInput>({
    resolver: zodResolver(EditorSchema),
    defaultValues: {
      title:       article?.title ?? '',
      excerpt:     article?.excerpt ?? '',
      slug:        article?.slug ?? '',
      categoryIds: article?.categories.map((c) => c.id) ?? [],
      status:      article?.status ?? 'draft',
      coverImage:  article?.coverImage ?? '',
    },
  });

  const watchTitle  = watch('title');
  const watchStatus = watch('status');

  // Auto-generate slug from title
  useEffect(() => {
    if (!article) {
      setValue('slug', slugify(watchTitle));
    }
  }, [watchTitle, article, setValue]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Write your article here…' }),
      Image,
      Link.configure({ openOnClick: false }),
      Underline,
    ],
    content: article?.content ?? '',
    editorProps: {
      attributes: {
        class: 'min-h-[400px] p-4 outline-none font-sans text-body',
      },
    },
  });

  const getAuthClient = () => {
    const token = document.cookie.split('; ').find((r) => r.startsWith('access_token='))?.split('=')[1];
    return new GraphQLClient(`${API_URL}/graphql`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const response = await fetch(`${API_URL}/upload/article-cover`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${document.cookie.split('; ').find((r) => r.startsWith('access_token='))?.split('=')[1] ?? ''}`,
          },
          body: JSON.stringify({ image: `data:${file.type};base64,${base64}` }),
        });

        if (!response.ok) throw new Error('Upload failed');
        const { url } = await response.json() as { url: string };
        setValue('coverImage', url);
        setCoverPreview(url);
        toast.success('Cover image uploaded!');
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Failed to upload cover image');
    } finally {
      setImageUploading(false);
    }
  };

  const onSubmit = async (data: EditorInput) => {
    const content = editor?.getHTML() ?? '';
    if (!content || content === '<p></p>') {
      toast.error('Article content cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const client = getAuthClient();

      if (article) {
        await client.request(UPDATE_ARTICLE, {
          id: article.id,
          input: { ...data, content, coverImage: data.coverImage || null },
        });
        toast.success('Article updated!');
        router.refresh();
      } else {
        const result = await client.request<{ createArticle: { slug: string } }>(CREATE_ARTICLE, {
          input: { ...data, content, coverImage: data.coverImage || null },
        });
        toast.success('Article saved!');
        router.push(`/dashboard/articles`);
      }
    } catch (err) {
      toast.error('Failed to save article. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (id: string, current: string[]) => {
    if (current.includes(id)) {
      return current.filter((c) => c !== id);
    }
    return [...current, id];
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Article Title *</Label>
        <Input
          id="title"
          placeholder="Enter a compelling headline…"
          className={cn('text-body font-serif h-12', errors.title && 'border-destructive')}
          {...register('title')}
        />
        {errors.title && <p className="text-caption text-destructive">{errors.title.message}</p>}
      </div>

      {/* Slug */}
      <div className="space-y-1.5">
        <Label htmlFor="slug">URL Slug</Label>
        <Input
          id="slug"
          placeholder="article-url-slug"
          className={errors.slug ? 'border-destructive font-mono text-caption' : 'font-mono text-caption'}
          {...register('slug')}
        />
        {errors.slug && <p className="text-caption text-destructive">{errors.slug.message}</p>}
      </div>

      {/* Excerpt */}
      <div className="space-y-1.5">
        <Label htmlFor="excerpt">Excerpt (optional)</Label>
        <Textarea
          id="excerpt"
          placeholder="A brief summary of your article (shown in listings and SEO)…"
          rows={3}
          maxLength={500}
          {...register('excerpt')}
        />
      </div>

      {/* Cover image */}
      <div className="space-y-2">
        <Label>Cover Image</Label>
        {coverPreview ? (
          <div className="relative rounded-md overflow-hidden aspect-[16/9] max-h-64 bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => { setValue('coverImage', ''); setCoverPreview(''); }}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-40 rounded-md border-2 border-dashed border-border hover:border-amber-400 cursor-pointer transition-colors bg-muted/20">
            <input type="file" accept="image/*" onChange={handleCoverUpload} className="sr-only" />
            {imageUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-caption text-muted-foreground">Click to upload cover image</p>
                <p className="text-[0.65rem] text-muted-foreground">JPG, PNG, WebP up to 10MB</p>
              </>
            )}
          </label>
        )}
      </div>

      {/* Categories */}
      <Controller
        control={control}
        name="categoryIds"
        render={({ field }) => (
          <div className="space-y-2">
            <Label>Categories * <span className="text-caption text-muted-foreground">(select 1–5)</span></Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const selected = field.value.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => field.onChange(toggleCategory(cat.id, field.value))}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-caption font-medium border transition-all',
                      selected
                        ? 'bg-amber-500 border-amber-500 text-ink-900'
                        : 'bg-background border-border hover:border-amber-400 text-foreground'
                    )}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
            {errors.categoryIds && (
              <p className="text-caption text-destructive">{errors.categoryIds.message}</p>
            )}
          </div>
        )}
      />

      {/* Rich text editor */}
      <div className="space-y-2">
        <Label>Content *</Label>
        {/* Toolbar */}
        {editor && (
          <div className="flex flex-wrap gap-1 p-2 border border-border rounded-t-md bg-muted/20">
            {[
              { label: 'B',  action: () => editor.chain().focus().toggleBold().run(),        active: editor.isActive('bold') },
              { label: 'I',  action: () => editor.chain().focus().toggleItalic().run(),      active: editor.isActive('italic') },
              { label: 'U',  action: () => editor.chain().focus().toggleUnderline().run(),   active: editor.isActive('underline') },
              { label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
              { label: 'H3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
              { label: '❝',  action: () => editor.chain().focus().toggleBlockquote().run(),  active: editor.isActive('blockquote') },
              { label: '•',  action: () => editor.chain().focus().toggleBulletList().run(),  active: editor.isActive('bulletList') },
              { label: '1.', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={btn.action}
                className={cn(
                  'px-2 py-1 rounded text-body-sm font-medium transition-colors',
                  btn.active ? 'bg-ink-900 text-white' : 'hover:bg-muted text-foreground'
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
        <div className="border border-border border-t-0 rounded-b-md min-h-[400px] bg-background">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Status + Submit */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-border">
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <Switch
                id="publish"
                checked={field.value === 'published'}
                onCheckedChange={(checked) => field.onChange(checked ? 'published' : 'draft')}
              />
              <Label htmlFor="publish" className="cursor-pointer">
                {field.value === 'published' ? (
                  <span className="text-green-700 dark:text-green-400 font-semibold">Published</span>
                ) : (
                  <span className="text-muted-foreground">Save as Draft</span>
                )}
              </Label>
            </div>
          )}
        />

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" variant="amber" disabled={saving} className="gap-2 min-w-[120px]">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving…' : article ? 'Update Article' : 'Save Article'}
          </Button>
        </div>
      </div>
    </form>
  );
}