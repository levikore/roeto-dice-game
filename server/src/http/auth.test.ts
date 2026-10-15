import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.ts';
import { openDb } from '../db/db.ts';

let db: ReturnType<typeof openDb>;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  db = openDb(':memory:');
  app = createApp({ db, jwtSecret: 'test-secret' });
});

const register = (username: string, password: string) =>
  request(app).post('/api/auth/register').send({ username, password });

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token', async () => {
    const res = await register('alice', 'secret1');
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ username: 'alice', wins: 0 });
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('rejects a duplicate username, ignoring case', async () => {
    await register('alice', 'secret1');
    const res = await register('ALICE', 'secret2');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('USERNAME_TAKEN');
  });

  it.each([
    ['', 'secret1'],
    ['al', 'secret1'],
    ['bad name!', 'secret1'],
    ['alice', ''],
    ['alice', '123'],
  ])('rejects invalid input %j / %j with 400', async (u, p) => {
    const res = await register(u, p);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a malformed JSON body with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{bad');
    expect(res.status).toBe(400);
  });

  it('stores a bcrypt hash, never the plain password', async () => {
    await register('alice', 'secret1');
    const row = db.prepare('SELECT password_hash FROM users').get() as { password_hash: string };
    expect(row.password_hash).toMatch(/^\$2[aby]\$10\$/);
    expect(row.password_hash).not.toContain('secret1');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await register('alice', 'secret1');
  });

  it('returns a token for correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'secret1' });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('is case-insensitive on the username', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ALICE', password: 'secret1' });
    expect(res.status).toBe(200);
  });

  it('gives the same 401 for a wrong password and an unknown user', async () => {
    const wrongPw = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'nope-nope' });
    const noUser = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ghost', password: 'secret1' });
    expect(wrongPw.status).toBe(401);
    expect(noUser.status).toBe(401);
    expect(wrongPw.body).toEqual(noUser.body);
    expect(wrongPw.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('gives 401 (not 400) for a malformed login body', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(401);
  });
});
