import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.ts';
import { openDb } from '../db/db.ts';

const SECRET = 'test-secret';
let db: ReturnType<typeof openDb>;
let app: ReturnType<typeof createApp>;
let token: string;
let userId: string;

beforeEach(async () => {
  db = openDb(':memory:');
  app = createApp({ db, jwtSecret: SECRET });
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username: 'alice', password: 'secret1' });
  token = res.body.token;
  userId = res.body.user.id;
});

const me = (header?: string) => {
  const r = request(app).get('/api/auth/me');
  return header ? r.set('Authorization', header) : r;
};

describe('requireAuth via GET /api/auth/me', () => {
  it('returns the current user for a valid token', async () => {
    const res = await me(`Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: userId, username: 'alice', wins: 0 });
  });

  it('rejects a missing token', async () => {
    const res = await me();
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it.each(['Bearer', 'Bearer ', 'Basic abc', 'Bearer not.a.jwt', 'token'])(
    'rejects malformed header %j',
    async (h) => {
      expect((await me(h)).status).toBe(401);
    },
  );

  it('rejects an expired token', async () => {
    const expired = jwt.sign({ sub: userId }, SECRET, { expiresIn: -10 });
    expect((await me(`Bearer ${expired}`)).status).toBe(401);
  });

  it('rejects a token signed with a different secret', async () => {
    const forged = jwt.sign({ sub: userId }, 'other-secret');
    expect((await me(`Bearer ${forged}`)).status).toBe(401);
  });

  it('rejects an unsigned (alg none) token', async () => {
    const none =
      Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url') +
      '.' +
      Buffer.from(`{"sub":"${userId}"}`).toString('base64url') +
      '.';
    expect((await me(`Bearer ${none}`)).status).toBe(401);
  });

  it('rejects a valid token whose user no longer exists', async () => {
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    expect((await me(`Bearer ${token}`)).status).toBe(401);
  });
});
