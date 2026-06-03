// apps/api/src/tests/integration/routes/upload.route.test.ts
import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

process.env['JWT_SECRET'] = 'test-secret-at-least-32-chars-long!!';
process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-32-chars-long!';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5433/test';
process.env['REDIS_URL'] = 'redis://localhost:6379';
process.env['CLOUDINARY_CLOUD_NAME'] = 'test';
process.env['CLOUDINARY_API_KEY'] = 'test';
process.env['CLOUDINARY_API_SECRET'] = 'test';

// Mock Cloudinary
vi.mock('../../../services/cloudinary.service.js', () => ({
  cloudinaryService: {
    uploadArticleCover: vi.fn().mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test/image/upload/v1/cover.jpg',
      public_id: 'pentimes/covers/cover',
    }),
    uploadAvatar: vi.fn().mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test/image/upload/v1/avatar.jpg',
      public_id: 'pentimes/avatars/avatar_user1',
    }),
  },
}));

const { uploadRouter } = await import('../../../routes/upload.route.js');

function buildApp() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());
  app.use('/upload', uploadRouter);
  return app;
}

function makeToken(role: string) {
  return jwt.sign(
    { sub: 'user-1', email: 'test@test.com', role },
    process.env['JWT_SECRET']!,
    { expiresIn: '1h' }
  );
}

describe('POST /upload/article-cover', () => {
  let app: express.Express;
  beforeAll(() => { app = buildApp(); });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/upload/article-cover')
      .send({ image: 'data:image/jpeg;base64,abc123' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for reader role', async () => {
    const token = makeToken('reader');
    const res = await request(app)
      .post('/upload/article-cover')
      .set('Authorization', `Bearer ${token}`)
      .send({ image: 'data:image/jpeg;base64,abc123' });
    expect(res.status).toBe(403);
  });

  it('returns 200 with URL for author role', async () => {
    const token = makeToken('author');
    const res = await request(app)
      .post('/upload/article-cover')
      .set('Authorization', `Bearer ${token}`)
      .send({ image: 'data:image/jpeg;base64,abc123' });
    expect(res.status).toBe(200);
    expect(res.body.url).toContain('cloudinary.com');
  });

  it('returns 400 for missing image field', async () => {
    const token = makeToken('author');
    const res = await request(app)
      .post('/upload/article-cover')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /upload/avatar', () => {
  let app: express.Express;
  beforeAll(() => { app = buildApp(); });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/upload/avatar')
      .send({ image: 'data:image/jpeg;base64,abc' });
    expect(res.status).toBe(401);
  });

  it('returns 200 for any authenticated user', async () => {
    const token = makeToken('reader');
    const res = await request(app)
      .post('/upload/avatar')
      .set('Authorization', `Bearer ${token}`)
      .send({ image: 'data:image/jpeg;base64,abc' });
    expect(res.status).toBe(200);
    expect(res.body.url).toContain('cloudinary.com');
  });
});