import { Router }                    from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import {
  cloudinaryService,
  avatarPublicId,
  isManagedPublicId,
}                                    from '../services/cloudinary.service.js';
import { ApiError }                from '../middleware/errorHandler.middleware.js';
import { assertValidImageDataUri } from '../helpers/image-validation.js';

export const uploadRouter: Router = Router();

uploadRouter.use(authenticate);

// POST /upload/article-cover
// Body: { image: string (base64 data URI) }
// Any other field (e.g. a legacy fileName) is ignored: IDs are server-generated.
uploadRouter.post(
  '/article-cover',
  requireRole('author', 'admin'),
  async (req, res, next) => {
    try {
      const image = assertValidImageDataUri((req.body as { image?: unknown }).image);

      const result = await cloudinaryService.uploadArticleCover(image);
      res.status(200).json({ url: result.secure_url, publicId: result.public_id });
    } catch (err) {
      next(err);
    }
  }
);

// POST /upload/avatar
// Body: { image: string (base64 data URI) }
uploadRouter.post('/avatar', async (req, res, next) => {
  try {
    const image = assertValidImageDataUri((req.body as { image?: unknown }).image);

    const result = await cloudinaryService.uploadAvatar(image, req.user!.sub);
    res.status(200).json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    next(err);
  }
});

// DELETE /upload/:publicId
// publicId contains slashes, so the client must URL-encode it:
//   DELETE /upload/pentimes%2Favatars%2Favatar_<userId>
// Permissions:
//   - admin: any asset inside the app's managed Cloudinary folders
//   - everyone else: only their own avatar
uploadRouter.delete('/:publicId', async (req, res, next) => {
  try {
    const { publicId } = req.params as { publicId: string };
    const user = req.user!;

    if (!isManagedPublicId(publicId)) {
      throw ApiError.badRequest('Invalid image identifier', 'publicId');
    }

    const isAdmin = user.role === 'admin';
    if (!isAdmin && publicId !== avatarPublicId(user.sub)) {
      throw ApiError.forbidden('You do not have permission to delete this image');
    }

    const { result } = await cloudinaryService.deleteImage(publicId);
    if (result === 'not found') throw ApiError.notFound('Image');

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});