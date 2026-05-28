export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function uniqueSlug(base: string): string {
  const suffix = Date.now().toString(36);
  return `${slugify(base)}-${suffix}`;
}