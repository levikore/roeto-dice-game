import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DiceRoll } from '@dice/shared';
import { createApp } from '../app.ts';
import { openDb } from '../db/db.ts';
import { seed } from '../db/seed.ts';

let app: ReturnType<typeof createApp>;
let db: ReturnType<typeof openDb>;
let queue: DiceRoll[];
let A: string;
let B: string;

const login = async (u: string) =>
  (await request(app).post('/api/auth/login').send({ username: u, password: 'demo1234' })).body
    .token as string;
const as = (t: string) => ({ Authorization: `Bearer ${t}` });
const userCount = () => (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;

beforeEach(async () => {
  db = openDb(':memory:');
  seed(db, 'demo1234');
  queue = [];
  app = createApp({
    db,
    jwtSecret: 's',
    dice: { roll: () => queue.shift() ?? [1, 1] },
    authRateLimit: { windowMs: 60_000, max: 1000 },
  });
  A = await login('alice');
  B = await login('bob');
});

describe('tampering attempts', () => {
  it('SQL-injection strings in login and register change nothing', async () => {
    const before = userCount();
    for (const username of ["' OR '1'='1", "alice'; DROP TABLE users; --", 'a" OR 1=1 --']) {
      const login = await request(app)
        .post('/api/auth/login')
        .send({ username, password: "' OR '1'='1" });
      expect(login.status).toBe(401);
      const reg = await request(app)
        .post('/api/auth/register')
        .send({ username, password: 'secret1' });
      expect(reg.status).toBe(400);
    }
    expect(userCount()).toBe(before);
  });

  it('injection in a game id is just an unknown game (404), never a crash or leak', async () => {
    for (const id of ["' OR 1=1 --", "x'; DROP TABLE games; --", '%00', '../../etc/passwd']) {
      const res = await request(app)
        .get(`/api/games/${encodeURIComponent(id)}`)
        .set(as(A));
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('GAME_NOT_FOUND');
    }
    expect(db.prepare('SELECT COUNT(*) FROM games').get()).toBeDefined();
  });

  it('extra body fields cannot set dice, scores or identity on roll/hold', async () => {
    const id = (await request(app).post('/api/games').set(as(A)).send({ opponent: 'human' })).body
      .game.id;
    await request(app).post(`/api/games/${id}/join`).set(as(B));
    queue.push([2, 3]);
    const res = await request(app)
      .post(`/api/games/${id}/roll`)
      .set(as(A))
      .send({
        dice: [6, 6],
        roundScore: 999,
        userId: 'someone-else',
        currentPlayerIndex: 1,
        status: 'FINISHED',
      });
    expect(res.status).toBe(200);
    expect(res.body.game).toMatchObject({ roundScore: 5, status: 'IN_PROGRESS' });
    expect(res.body.events[0].dice).toEqual([2, 3]);
  });

  it('cannot create a game with extra fields that set state', async () => {
    const res = await request(app)
      .post('/api/games')
      .set(as(A))
      .send({ opponent: 'human', status: 'FINISHED', winnerId: 'x', version: 99, roundScore: 50 });
    expect(res.body.game).toMatchObject({
      status: 'WAITING',
      winnerId: null,
      roundScore: 0,
      version: 0,
    });
  });

  it('cannot give yourself wins, bot status or an id when registering', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'mallory', password: 'secret1', wins: 99, is_bot: 1, id: 'admin' });
    expect(res.body.user.wins).toBe(0);
    expect(res.body.user.id).not.toBe('admin');
    const row = db.prepare("SELECT wins, is_bot FROM users WHERE username = 'mallory'").get();
    expect(row).toEqual({ wins: 0, is_bot: 0 });
  });

  it('a JSON body with __proto__ does not pollute anything', async () => {
    const res = await request(app)
      .post('/api/games')
      .set(as(A))
      .set('Content-Type', 'application/json')
      .send('{"__proto__":{"polluted":true},"opponent":"human"}');
    expect(res.status).toBe(201);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("another player's token cannot act on your turn, and your token cannot act as them", async () => {
    const id = (await request(app).post('/api/games').set(as(A)).send({})).body.game.id;
    await request(app).post(`/api/games/${id}/join`).set(as(B));
    expect((await request(app).post(`/api/games/${id}/roll`).set(as(B))).body.error.code).toBe(
      'NOT_YOUR_TURN',
    );
    queue.push([1, 2]);
    // A cannot pass B's id in the body to act as B: the identity comes only from the token.
    const res = await request(app).post(`/api/games/${id}/roll`).set(as(A)).send({ userId: 'bob' });
    expect(res.body.events[0].userId).toBe(res.body.game.players[0].userId);
  });
});

describe('error responses', () => {
  it('unknown API paths return the standard JSON error, not HTML', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('a server fault returns a generic 500 with no stack trace or internals', async () => {
    const id = (await request(app).post('/api/games').set(as(A)).send({})).body.game.id;
    db.exec('DROP TABLE game_players'); // force an unexpected failure
    const res = await request(app).get(`/api/games/${id}`).set(as(A));
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
    expect(JSON.stringify(res.body)).not.toMatch(/sqlite|at .*\.ts|no such table/i);
  });
});
