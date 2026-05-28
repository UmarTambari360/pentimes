import { db }         from '../config/db.js';
import { categories } from '../db/schema/index.js';
import { eq }         from 'drizzle-orm';

export async function findAllCategories() {
  return db.query.categories.findMany({
    orderBy: (c, { asc }) => [asc(c.name)],
  });
}

export async function findCategoryBySlug(slug: string) {
  const result = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });
  return result ?? null;
}

export async function findCategoryById(id: string) {
  const result = await db.query.categories.findFirst({
    where: eq(categories.id, id),
  });
  return result ?? null;
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string | null;
}) {
  const [category] = await db.insert(categories).values(data).returning();
  return category!;
}

export async function updateCategory(id: string, data: Partial<{
  name: string;
  slug: string;
  description: string | null;
}>) {
  const [category] = await db
    .update(categories)
    .set(data)
    .where(eq(categories.id, id))
    .returning();
  return category ?? null;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const result = await db.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id });
  return result.length > 0;
}