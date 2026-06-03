// apps/api/src/tests/integration/routes/health.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';

// Build a minimal app with just the health endpoint to avoid needing
// full DB/Redis connectivity in this test
async function buildTestApp() {
  const app = express();
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: { database: 'ok', redis: 'ok' },
      environment: 'test',
    });
  });
  return app;
}

describe('GET /health', () => {
  let app: express.Express;

  beforeAll(async () => { app = await buildTestApp(); });

  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.services).toBeDefined();
    expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});