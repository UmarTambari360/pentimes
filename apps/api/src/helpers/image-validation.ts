import { CLOUDINARY }  from '@pentimes/shared';
import { ApiError }    from '../middleware/errorHandler.middleware.js';

export type AllowedImageMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

const ALLOWED_MIME_TYPES: readonly AllowedImageMime[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const MAX_IMAGE_BYTES = CLOUDINARY.MAX_FILE_SIZE_MB * 1024 * 1024;

// Only inline base64 data URIs are accepted. Plain URLs are rejected on purpose:
// Cloudinary would otherwise fetch any remote address we hand it.
const DATA_URI_PREFIX = /^data:([a-z]+\/[a-z0-9.+-]+);base64,/i;
const BASE64_BODY     = /^[A-Za-z0-9+/]+={0,2}$/;

/** Detect the real image type from the file's first bytes (magic numbers). */
function sniffMime(head: Buffer): AllowedImageMime | null {
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    head.length >= 8 &&
    head.subarray(0, 8).every((byte, index) =>
      byte === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index]
    )
  ) {
    return 'image/png';
  }
  if (head.length >= 6) {
    const sig = head.subarray(0, 6).toString('ascii');
    if (sig === 'GIF87a' || sig === 'GIF89a') return 'image/gif';
  }
  if (
    head.length >= 12 &&
    head.subarray(0, 4).toString('ascii') === 'RIFF' &&
    head.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

/**
 * Validates an uploaded image sent as a base64 data URI and returns it
 * unchanged when it is safe to forward to Cloudinary. Throws ApiError otherwise.
 *
 * Checks: it is a string data URI, declared type is allowed, base64 is
 * well-formed, decoded size is within the limit, and the file's real
 * content matches the declared type.
 */
export function assertValidImageDataUri(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw ApiError.badRequest('image (base64) is required', 'image');
  }

  const prefix = DATA_URI_PREFIX.exec(value.slice(0, 100));
  if (!prefix) {
    throw ApiError.badRequest(
      'image must be a base64 data URI (data:image/...;base64,...)',
      'image'
    );
  }

  const declared = prefix[1]!.toLowerCase() as AllowedImageMime;
  if (!ALLOWED_MIME_TYPES.includes(declared)) {
    throw ApiError.badRequest('Only JPG, PNG, WebP, and GIF images are allowed', 'image');
  }

  const base64 = value.slice(prefix[0].length);
  if (base64.length === 0 || base64.length % 4 !== 0 || !BASE64_BODY.test(base64)) {
    throw ApiError.badRequest('image contains invalid base64 data', 'image');
  }

  // Decoded size from the base64 length (no need to decode the whole file)
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  const decodedBytes = (base64.length / 4) * 3 - padding;
  if (decodedBytes > MAX_IMAGE_BYTES) {
    throw new ApiError(
      `Image must be under ${CLOUDINARY.MAX_FILE_SIZE_MB} MB`,
      413,
      'PAYLOAD_TOO_LARGE',
      'image'
    );
  }

  // Real content check: the first bytes must match an allowed image format
  // AND agree with the type the client declared.
  const head = Buffer.from(base64.slice(0, 32), 'base64');
  const actual = sniffMime(head);
  if (actual === null || actual !== declared) {
    throw ApiError.badRequest('File content does not match a supported image type', 'image');
  }

  return value;
}