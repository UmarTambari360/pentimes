import { Router }                    from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { cloudinaryService }        from '../services/cloudinary.service.js';
import { ApiError }                from '../middleware/errorHandler.middleware.js';

export const uploadRouter = Router();

uploadRouter.use(authenticate);

// POST /upload/article-cover
// Body: { image: string (base64), fileName?: string }
uploadRouter.post(
  '/article-cover',
  requireRole('author', 'admin'),
  async (req, res, next) => {
    try {
      const { image, fileName } = req.body as {
        image?: string;
        fileName?: string;
      };
      if (!image) throw ApiError.badRequest('image (base64) is required', 'image');

      const result = await cloudinaryService.uploadArticleCover(image, fileName);
      res.status(200).json({ url: result.secure_url, publicId: result.public_id });
    } catch (err) {
      next(err);
    }
  }
);

// POST /upload/avatar
// Body: { image: string (base64) }
uploadRouter.post('/avatar', async (req, res, next) => {
  try {
    const { image } = req.body as { image?: string };
    if (!image) throw ApiError.badRequest('image (base64) is required', 'image');

    const result = await cloudinaryService.uploadAvatar(image, req.user!.sub);
    res.status(200).json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    next(err);
  }
});

// DELETE /upload/:publicId
uploadRouter.delete('/:publicId', async (req, res, next) => {
  try {
    const { publicId } = req.params as { publicId: string };
    await cloudinaryService.deleteImage(publicId);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});