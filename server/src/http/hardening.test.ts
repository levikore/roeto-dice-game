import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.ts';
import { openDb } from '../db/db.ts';

const make = (extra = {}) =>
  createApp({ db: openDb(':memory:'), jwtSecret: 's', clientOrigin: 'http://app.test', ...extra });

describe('hardening', () => {
  it('sets security headers and hides X-Powered-By', async () => {
    const res = await request(make()).get('/api/auth/me');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('only ever allows the configured CORS origin', async () => {
    const app = make();
    const ok = await request(app).get('/api/auth/me').set('Origin', 'http://app.test');
    const bad = await request(app).get('/api/auth/me').set('Origin', 'http://evil.test');
    expect(ok.headers['access-control-allow-origin']).toBe('http://app.test');
    // The header names the allowed origin only, so a browser on evil.test is blocked.
    expect(bad.headers['access-control-allow-origin']).not.toBe('http://evil.test');
  });

  it('rate-limits login attempts with a 429 in the standard error shape', async () => {
    const app = make({ authRateLimit: { windowMs: 60_000, max: 3 } });
    const attempt = () =>
      request(app).post('/api/auth/login').send({ username: 'x', password: 'wrongwrong' });
    for (let i = 0; i < 3; i++) expect((await attempt()).status).toBe(401);
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
  });

  it('does not rate-limit /me', async () => {
    const app = make({ authRateLimit: { windowMs: 60_000, max: 1 } });
    for (let i = 0; i < 3; i++) expect((await request(app).get('/api/auth/me')).status).toBe(401);
  });

  it('rejects an oversized body', async () => {
    const res = await request(make())
      .post('/api/auth/register')
      .send({ username: 'a'.repeat(20_000), password: 'secret1' });
    expect(res.status).toBe(413);
  });
});
