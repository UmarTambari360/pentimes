export function formatDate(date: Date | string): string {
  return new Date(date).toISOString();
}

export function isExpired(date: Date | string): boolean {
  return new Date(date).getTime() < Date.now();
}