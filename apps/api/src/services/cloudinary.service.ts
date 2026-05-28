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

export const cloudinaryService = {
  async uploadArticleCover(
    base64Image: string,
    fileName?: string
  ): Promise<UploadApiResponse> {
    const options: UploadApiOptions = {
      folder: CLOUDINARY.ARTICLE_COVERS_FOLDER,
      overwrite: false,
      transformation: [
        { width: 1200, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
      resource_type: 'image',
    };

    // Only set public_id if provided (Cloudinary auto-generates if omitted)
    if (fileName) {
      options.public_id = fileName;
    }

    return cloudinary.uploader.upload(base64Image, options);
  },

  async uploadAvatar(
    base64Image: string,
    userId: string
  ): Promise<UploadApiResponse> {
    return cloudinary.uploader.upload(base64Image, {
      folder: CLOUDINARY.AVATARS_FOLDER,
      public_id: `avatar_${userId}`,
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