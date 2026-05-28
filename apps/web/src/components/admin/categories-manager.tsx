"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraphQLClient } from "graphql-request";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import {
  CREATE_CATEGORY,
  DELETE_CATEGORY,
  UPDATE_CATEGORY,
} from "@/lib/graphql/queries/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CategoryType } from "@/types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

const CategorySchema = z.object({
  name: z.string().min(2, "At least 2 characters").max(100),
  description: z.string().max(500).optional(),
});

interface CategoriesManagerProps {
  categories: CategoryType[];
}

export function CategoriesManager({
  categories: initialCategories,
}: CategoriesManagerProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof CategorySchema>>({
    resolver: zodResolver(CategorySchema),
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

  const handleCreate = async (data: z.infer<typeof CategorySchema>) => {
    setSaving(true);
    try {
      const client = getAuthClient();
      const result = await client.request<{
        createCategory: CategoryType;
      }>(CREATE_CATEGORY, { input: data });
      setCategories((prev) => [...prev, result.createCategory]);
      toast.success("Category created!");
      reset();
    } catch {
      toast.error("Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStart = (cat: CategoryType) => {
    setEditId(cat.id);
    setEditName(cat.name);
  };

  const handleUpdate = async (id: string) => {
    try {
      const client = getAuthClient();
      await client.request(UPDATE_CATEGORY, { id, input: { name: editName } });
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: editName } : c)),
      );
      toast.success("Category updated!");
      setEditId(null);
    } catch {
      toast.error("Failed to update category");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Delete this category? Articles in this category will lose this association.",
      )
    )
      return;
    try {
      const client = getAuthClient();
      await client.request(DELETE_CATEGORY, { id });
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
      <form
        onSubmit={handleSubmit(handleCreate)}
        className="p-5 rounded-lg border border-border bg-card shadow-card space-y-4"
      >
        <h2 className="font-serif font-semibold text-body">Add New Category</h2>
        <div className="space-y-1.5">
          <Label>Category Name *</Label>
          <Input
            placeholder="e.g. Politics, Education, Health"
            {...register("name")}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-caption text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Description (optional)</Label>
          <Input
            placeholder="Brief description of this category"
            {...register("description")}
          />
        </div>
        <Button
          type="submit"
          variant="amber"
          size="sm"
          disabled={saving}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {saving ? "Creating…" : "Create Category"}
        </Button>
      </form>

      {/* Categories list */}
      <div className="rounded-lg border border-border overflow-hidden">
        {categories.length === 0 ? (
          <p className="text-center py-8 text-body-sm text-muted-foreground">
            No categories yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center gap-3 p-4">
                {editId === cat.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 h-8 text-body-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(cat.id);
                        if (e.key === "Escape") setEditId(null);
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdate(cat.id)}
                      className="text-green-600 hover:text-green-700 p-1"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium">{cat.name}</p>
                      <p className="text-caption text-muted-foreground font-mono">
                        /category/{cat.slug}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUpdateStart(cat)}
                      className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                      aria-label="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
