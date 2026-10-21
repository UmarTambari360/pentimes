import { randomUUID }       from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import type { 
  UploadApiResponse, 
  UploadApiOptions }        from 'cloudinary';
import { env }              from '../config/env.js';
import { CLOUDINARY }       from '@pentimes/shared';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Only assets inside the app's own Cloudinary folders may ever be deleted.
// This stops the API (and any compromised account) from touching other files
// in the Cloudinary account, such as logos or assets used by other projects.
const MANAGED_FOLDERS: readonly string[] = [
  CLOUDINARY.ARTICLE_COVERS_FOLDER,
  CLOUDINARY.AVATARS_FOLDER,
];

const avatarName = (userId: string): string => `avatar_${userId}`;

/** Full Cloudinary public ID of a user's avatar, e.g. pentimes/avatars/avatar_<id> */
export function avatarPublicId(userId: string): string {
  return `${CLOUDINARY.AVATARS_FOLDER}/${avatarName(userId)}`;
}

/** True only for well-formed public IDs inside the app's managed folders. */
export function isManagedPublicId(publicId: string): boolean {
  if (publicId.length === 0 || publicId.length > 255) return false;
  if (/[\u0000-\u001f]/.test(publicId)) return false;

  const segments = publicId.split('/');
  if (segments.some((s) => s === '' || s === '.' || s === '..')) return false;

  return MANAGED_FOLDERS.some((folder) => publicId.startsWith(`${folder}/`));
}

export const cloudinaryService = {
  async uploadArticleCover(base64Image: string): Promise<UploadApiResponse> {
    const options: UploadApiOptions = {
      folder: CLOUDINARY.ARTICLE_COVERS_FOLDER,
      // Server-generated ID: never use a client-supplied file name, which could
      // collide with another asset or smuggle path characters into the ID.
      public_id: randomUUID(),
      overwrite: false,
      transformation: [
        { width: 1200, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
      resource_type: 'image',
    };

    return cloudinary.uploader.upload(base64Image, options);
  },

  async uploadAvatar(
    base64Image: string,
    userId: string
  ): Promise<UploadApiResponse> {
    return cloudinary.uploader.upload(base64Image, {
      folder: CLOUDINARY.AVATARS_FOLDER,
      public_id: avatarName(userId),
      overwrite: true,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
      resource_type: 'image',
    });
  },

  async deleteImage(publicId: string): Promise<{ result: string }> {
    return cloudinary.uploader.destroy(publicId);
  },

  getOptimisedUrl(
    publicId: string,
    options: { width?: number; height?: number; crop?: string } = {}
  ): string {
    return cloudinary.url(publicId, {
      fetch_format: 'auto',
      quality: 'auto',
      ...options,
    });
  },
};