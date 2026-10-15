import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.ts';
import { openDb } from './db.ts';
import { BOT_USERNAME, seed } from './seed.ts';

describe('seed', () => {
  it('creates alice, bob and the bot, and is safe to run twice', () => {
    const db = openDb(':memory:');
    seed(db, 'demo1234');
    seed(db, 'demo1234');
    const rows = db.prepare('SELECT username, is_bot FROM users ORDER BY username').all();
    expect(rows).toEqual([
      { username: 'alice', is_bot: 0 },
      { username: 'bob', is_bot: 0 },
      { username: BOT_USERNAME, is_bot: 1 },
    ]);
  });

  it('lets the demo players log in with the demo password', async () => {
    const db = openDb(':memory:');
    seed(db, 'demo1234');
    const app = createApp({ db, jwtSecret: 's' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'demo1234' });
    expect(res.status).toBe(200);
  });

  it('does not let anyone log in as the bot', async () => {
    const db = openDb(':memory:');
    seed(db, 'demo1234');
    const app = createApp({ db, jwtSecret: 's' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'bot', password: 'demo1234' });
    expect(res.status).toBe(401);
  });
});
