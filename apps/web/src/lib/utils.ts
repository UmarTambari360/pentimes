import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string for display
 * e.g. "June 12, 2025"
 */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  }).format(new Date(dateString));
}

/**
 * Format a date string as relative time
 * e.g. "3 hours ago"
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now  = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60_000);
  const hours   = Math.floor(diff / 3_600_000);
  const days    = Math.floor(diff / 86_400_000);

  if (minutes < 1)  return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours   < 24) return `${hours}h ago`;
  if (days    < 7)  return `${days}d ago`;
  return formatDate(dateString);
}

/**
 * Format reading time
 * e.g. "5 min read"
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return '< 1 min read';
  return `${minutes} min read`;
}

/**
 * Truncate text to a max length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

/**
 * Generate initials from a name
 * e.g. "Aisha Bello" → "AB"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Build a full Cloudinary URL with transformations
 */
export function cloudinaryUrl(
  publicId: string,
  options: { width?: number; height?: number; crop?: string } = {}
): string {
  const cloudName = process.env['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'];
  if (!cloudName) return publicId;

  const transforms: string[] = ['f_auto', 'q_auto'];
  if (options.width)  transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.crop)   transforms.push(`c_${options.crop}`);

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(',')}/${publicId}`;
}