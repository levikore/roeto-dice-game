import type { DiceRoll } from '@dice/shared';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.ts';
import { openDb } from '../db/db.ts';
import { seed } from '../db/seed.ts';

let app: ReturnType<typeof createApp>;
let db: ReturnType<typeof openDb>;
let queue: DiceRoll[];
let clock: number;
let A: string; // alice's token
let B: string;
let C: string; // an outsider

const login = async (username: string) =>
  (await request(app).post('/api/auth/login').send({ username, password: 'demo1234' })).body
    .token as string;
const as = (token: string) => ({ Authorization: `Bearer ${token}` });
const create = (token: string, body: object = {}) =>
  request(app).post('/api/games').set(as(token)).send(body);
const act = (token: string, id: string, what: 'roll' | 'hold', body: object = {}) =>
  request(app).post(`/api/games/${id}/${what}`).set(as(token)).send(body);
const startGame = async (winningScore = 50) => {
  const id = (await create(A, { winningScore })).body.game.id as string;
  await request(app).post(`/api/games/${id}/join`).set(as(B));
  return id;
};

beforeEach(async () => {
  db = openDb(':memory:');
  seed(db, 'demo1234');
  queue = [];
  clock = 5_000_000;
  app = createApp({
    db,
    jwtSecret: 's',
    now: () => clock,
    dice: {
      roll: () => {
        const n = queue.shift();
        if (!n) throw new Error('fixed dice exhausted');
        return n;
      },
    },
    authRateLimit: { windowMs: 60_000, max: 1000 },
  });
  A = await login('alice');
  B = await login('bob');
  C = (
    await request(app).post('/api/auth/register').send({ username: 'carol', password: 'secret1' })
  ).body.token;
});

describe('authentication on game routes (B6)', () => {
  it.each([
    ['post', '/api/games'],
    ['get', '/api/games/x'],
    ['post', '/api/games/x/join'],
    ['post', '/api/games/x/roll'],
    ['post', '/api/games/x/hold'],
    ['post', '/api/games/x/new'],
  ] as const)('%s %s without a token → 401', async (method, url) => {
    const res = await request(app)[method](url);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});

describe('create and join', () => {
  it('creates (201), joins and returns a startable game', async () => {
    const created = await create(A, { winningScore: 30 });
    expect(created.status).toBe(201);
    expect(created.body.game).toMatchObject({ status: 'WAITING', winningScore: 30 });
    const joined = await request(app).post(`/api/games/${created.body.game.id}/join`).set(as(B));
    expect(joined.status).toBe(200);
    expect(joined.body.game).toMatchObject({ status: 'IN_PROGRESS', allowedActions: ['ROLL'] });
  });

  it('defaults the winning score to 100 and accepts an empty body', async () => {
    const res = await request(app).post('/api/games').set(as(A));
    expect(res.status).toBe(201);
    expect(res.body.game.winningScore).toBe(100);
  });

  it('starts a bot game at once', async () => {
    const res = await create(A, { opponent: 'bot' });
    expect(res.body.game.status).toBe('IN_PROGRESS');
    expect(res.body.game.players[1].username).toBe('bot');
  });

  it.each([
    [{ winningScore: 0 }, 'INVALID_WINNING_SCORE'],
    [{ winningScore: -5 }, 'INVALID_WINNING_SCORE'],
    [{ winningScore: 10001 }, 'INVALID_WINNING_SCORE'],
    [{ winningScore: 12.5 }, 'INVALID_WINNING_SCORE'],
    [{ winningScore: 'abc' }, 'VALIDATION_ERROR'],
    [{ opponent: 'dragon' }, 'VALIDATION_ERROR'],
  ])('rejects %j with 400 %s', async (body, code) => {
    const res = await create(A, body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(code);
  });

  it('returns 404 for an unknown game and 409 for joining twice', async () => {
    expect((await request(app).post('/api/games/nope/join').set(as(B))).status).toBe(404);
    const id = await startGame();
    expect((await request(app).post(`/api/games/${id}/join`).set(as(C))).status).toBe(409);
  });
});

describe('who can read and act (B5)', () => {
  it('lets only the two players read the game', async () => {
    const id = await startGame();
    expect((await request(app).get(`/api/games/${id}`).set(as(B))).status).toBe(200);
    const outsider = await request(app).get(`/api/games/${id}`).set(as(C));
    expect(outsider.status).toBe(403);
    expect(outsider.body.error.code).toBe('NOT_A_PLAYER');
  });

  it('blocks an outsider from acting', async () => {
    const id = await startGame();
    const res = await act(C, id, 'roll');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('NOT_A_PLAYER');
  });

  it("returns 403 NOT_YOUR_TURN when bob rolls on alice's turn", async () => {
    const id = await startGame();
    const res = await act(B, id, 'roll');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('NOT_YOUR_TURN');
  });
});

describe('roll and hold', () => {
  it('plays roll → hold and passes the turn', async () => {
    const id = await startGame();
    queue.push([4, 3]);
    const roll = await act(A, id, 'roll');
    expect(roll.status).toBe(200);
    expect(roll.body.game.roundScore).toBe(7);
    expect(roll.body.events[0]).toMatchObject({ type: 'ROLL', dice: [4, 3], scoreDelta: 7 });
    const hold = await act(A, id, 'hold');
    expect(hold.body.game.players[0].globalScore).toBe(7);
    expect(hold.body.game.currentPlayerId).toBe(hold.body.game.players[1].userId);
  });

  it('hold with nothing banked → 422', async () => {
    const id = await startGame();
    const res = await act(A, id, 'hold');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('NOTHING_TO_HOLD');
  });

  it('6&6 → turn passes, then 423 until the lock ends', async () => {
    const id = await startGame();
    queue.push([6, 6]);
    const bust = await act(A, id, 'roll');
    expect(bust.body.game).toMatchObject({
      roundScore: 0,
      lockRemainingMs: 1500,
      allowedActions: [],
    });
    const early = await act(B, id, 'roll');
    expect(early.status).toBe(423);
    expect(early.body.error.code).toBe('ACTIONS_LOCKED');
    clock += 1500;
    queue.push([1, 2]);
    expect((await act(B, id, 'roll')).status).toBe(200);
  });

  it('rejects a stale expectedVersion with 409 and a bad one with 400', async () => {
    const id = await startGame();
    const version = (await request(app).get(`/api/games/${id}`).set(as(A))).body.game.version;
    queue.push([1, 1], [1, 1]);
    expect((await act(A, id, 'roll', { expectedVersion: version })).status).toBe(200);
    const stale = await act(A, id, 'roll', { expectedVersion: version });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('STALE_VERSION');
    expect((await act(A, id, 'roll', { expectedVersion: 'x' })).status).toBe(400);
  });

  it('two simultaneous requests with the same expectedVersion: exactly one succeeds', async () => {
    const id = await startGame();
    const version = (await request(app).get(`/api/games/${id}`).set(as(A))).body.game.version;
    queue.push([2, 2], [3, 3]);
    const [first, second] = await Promise.all([
      act(A, id, 'roll', { expectedVersion: version }),
      act(A, id, 'roll', { expectedVersion: version }),
    ]);
    expect([first.status, second.status].sort()).toEqual([200, 409]);
    expect(
      (await request(app).get(`/api/games/${id}`).set(as(A))).body.game.roundScore,
    ).toBeLessThanOrEqual(6);
    expect(queue).toHaveLength(1); // only one roll was consumed
  });

  it('a hold that reaches the winning score finishes the game; further actions → 409', async () => {
    const id = await startGame(10);
    queue.push([5, 5]);
    await act(A, id, 'roll');
    const win = await act(A, id, 'hold');
    expect(win.body.game).toMatchObject({
      status: 'FINISHED',
      allowedActions: [],
      currentPlayerId: null,
    });
    expect(win.body.game.winnerId).toBe(win.body.game.players[0].userId);
    for (const who of [A, B]) {
      for (const what of ['roll', 'hold'] as const) {
        const res = await act(who, id, what);
        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('GAME_NOT_ACTIVE');
      }
    }
  });
});

describe('new game (R8)', () => {
  const newGame = (token: string, id: string, body: object = {}) =>
    request(app).post(`/api/games/${id}/new`).set(as(token)).send(body);
  const read = (token: string, id: string) => request(app).get(`/api/games/${id}`).set(as(token));

  it('abandons a game in progress and starts a fresh one with the same players and winning score', async () => {
    const id = await startGame(30);
    queue.push([5, 5]);
    await act(A, id, 'roll');
    await act(A, id, 'hold');
    const res = await newGame(B, id); // either player can restart, here the one who is not creator
    expect(res.status).toBe(201);
    expect(res.body.game.id).not.toBe(id);
    expect(res.body.game).toMatchObject({
      status: 'IN_PROGRESS',
      winningScore: 30,
      roundScore: 0,
      allowedActions: ['ROLL'],
    });
    expect(
      res.body.game.players.map((p: { username: string; globalScore: number }) => [
        p.username,
        p.globalScore,
      ]),
    ).toEqual([
      ['alice', 0],
      ['bob', 0],
    ]);
    const old = await read(A, id);
    expect(old.body.game).toMatchObject({
      status: 'ABANDONED',
      allowedActions: [],
      winnerId: null,
    });
    expect((await act(A, id, 'roll')).status).toBe(409);
  });

  it('works mid-lock after a 6&6 ("at any time")', async () => {
    const id = await startGame();
    queue.push([6, 6]);
    await act(A, id, 'roll');
    expect((await newGame(A, id)).status).toBe(201);
  });

  it('restarts a finished game and keeps the finished one as it was', async () => {
    const id = await startGame(10);
    queue.push([5, 5]);
    await act(A, id, 'roll');
    await act(A, id, 'hold');
    expect((await newGame(A, id)).status).toBe(201);
    expect((await read(A, id)).body.game.status).toBe('FINISHED');
  });

  it('restarts a bot game against the bot', async () => {
    const id = (await create(A, { opponent: 'bot' })).body.game.id;
    const res = await newGame(A, id);
    expect(res.body.game.players[1].username).toBe('bot');
  });

  it('blocks outsiders, waiting games, already-abandoned games and stale versions', async () => {
    const id = await startGame();
    expect((await newGame(C, id)).body.error.code).toBe('NOT_A_PLAYER');
    const waiting = (await create(A)).body.game.id;
    expect((await newGame(A, waiting)).body.error.code).toBe('GAME_NOT_ACTIVE');
    const stale = await newGame(A, id, { expectedVersion: 99 });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('STALE_VERSION');
    expect((await newGame(A, id)).status).toBe(201);
    const again = await newGame(A, id);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('GAME_NOT_ACTIVE');
  });
});

describe('wins and leaderboard (X1)', () => {
  const winGame = async (winner: string, winnerIsA = true) => {
    const id = await startGame(10);
    if (!winnerIsA) {
      queue.push([1, 1]);
      await act(A, id, 'roll');
      await act(A, id, 'hold');
    }
    queue.push([5, 5]);
    await act(winner === 'A' ? A : B, id, 'roll');
    return { id, hold: await act(winner === 'A' ? A : B, id, 'hold') };
  };
  const wins = async (token: string) =>
    (await request(app).get('/api/auth/me').set(as(token))).body.user.wins;
  const board = async () =>
    (await request(app).get('/api/leaderboard').set(as(A))).body.leaderboard;

  it('requires login', async () => {
    expect((await request(app).get('/api/leaderboard')).status).toBe(401);
  });

  it('adds exactly one win to the winner and none to the loser', async () => {
    const { hold } = await winGame('A');
    expect(hold.body.game.status).toBe('FINISHED');
    expect(await wins(A)).toBe(1);
    expect(await wins(B)).toBe(0);
    expect(hold.body.game.players[0].wins).toBe(1);
  });

  it('does not count again for actions after the win, or for restarting', async () => {
    const { id } = await winGame('A');
    await act(A, id, 'hold');
    await request(app).post(`/api/games/${id}/new`).set(as(A));
    expect(await wins(A)).toBe(1);
  });

  it('counts wins across several games and ranks the leaderboard', async () => {
    await winGame('A');
    await winGame('A');
    await winGame('B', false);
    expect(await wins(A)).toBe(2);
    expect(await wins(B)).toBe(1);
    const rows = await board();
    expect(rows.map((r: { username: string; wins: number }) => [r.username, r.wins])).toEqual([
      ['alice', 2],
      ['bob', 1],
      ['bot', 0],
      ['carol', 0],
    ]);
  });

  it('does not count an abandoned game as a win', async () => {
    const id = await startGame(10);
    queue.push([5, 5]);
    await act(A, id, 'roll');
    await request(app).post(`/api/games/${id}/new`).set(as(B));
    expect(await wins(A)).toBe(0);
  });

  it('full scripted game with brand-new users: register → create → join → play → win', async () => {
    const reg = async (u: string) =>
      (await request(app).post('/api/auth/register').send({ username: u, password: 'secret1' }))
        .body.token as string;
    const dave = await reg('dave');
    const erin = await reg('erin');
    const id = (await create(dave, { winningScore: 12 })).body.game.id;
    await request(app).post(`/api/games/${id}/join`).set(as(erin));
    queue.push([2, 3], [1, 1], [6, 6], [4, 4]);
    await act(dave, id, 'roll'); // dave round 5
    await act(dave, id, 'roll'); // dave round 7
    await act(dave, id, 'hold'); // dave 7
    await act(erin, id, 'roll'); // erin busts: 6&6
    clock += 1500;
    await act(dave, id, 'roll'); // dave round 8
    const win = await act(dave, id, 'hold'); // dave 15 >= 12
    expect(win.body.game).toMatchObject({ status: 'FINISHED' });
    expect(win.body.game.players[0]).toMatchObject({ username: 'dave', globalScore: 15, wins: 1 });
    expect(await wins(dave)).toBe(1);
    expect(await wins(erin)).toBe(0);
  });
});

describe('bot opponent plays inside the same request (X3)', () => {
  const startBotGame = async (winningScore = 100) =>
    (await create(A, { opponent: 'bot', winningScore })).body.game.id as string;
  const wins = async (token: string) =>
    (await request(app).get('/api/auth/me').set(as(token))).body.user.wins;

  it("after the human holds, the bot rolls and holds, then it is the human's turn again", async () => {
    const id = await startBotGame();
    queue.push([2, 3]); // human
    await act(A, id, 'roll');
    queue.push([5, 5], [5, 5]); // bot: 10, 20 → holds at 20
    const res = await act(A, id, 'hold');
    expect(res.status).toBe(200);
    expect(res.body.events.map((e: { type: string; userId: string }) => e.type)).toEqual([
      'HOLD',
      'ROLL',
      'ROLL',
      'HOLD',
    ]);
    const { players, currentPlayerId, allowedActions } = res.body.game;
    expect(
      players.map((p: { username: string; globalScore: number }) => [p.username, p.globalScore]),
    ).toEqual([
      ['alice', 5],
      ['bot', 20],
    ]);
    expect(currentPlayerId).toBe(players[0].userId);
    expect(allowedActions).toEqual(['ROLL']);
    expect(queue).toHaveLength(0);
  });

  it('plays the bot turn even right after the human busts (the pause is not an obstacle)', async () => {
    const id = await startBotGame();
    queue.push([6, 6]); // human busts
    queue.push([5, 5], [5, 5]); // bot rolls 20 and holds
    const res = await act(A, id, 'roll');
    expect(res.status).toBe(200);
    expect(res.body.events.map((e: { type: string }) => e.type)).toEqual([
      'BUST',
      'ROLL',
      'ROLL',
      'HOLD',
    ]);
    expect(res.body.game.players[1].globalScore).toBe(20);
  });

  it('when the bot busts, the turn and the pause go back to the human', async () => {
    const id = await startBotGame();
    queue.push([1, 1]);
    await act(A, id, 'roll');
    queue.push([4, 4], [6, 6]); // bot rolls 8 then busts
    const res = await act(A, id, 'hold');
    expect(res.body.events.map((e: { type: string }) => e.type)).toEqual(['HOLD', 'ROLL', 'BUST']);
    expect(res.body.game).toMatchObject({ roundScore: 0, allowedActions: [] });
    expect(res.body.game.lockRemainingMs).toBeGreaterThan(0);
    expect(res.body.game.currentPlayerId).toBe(res.body.game.players[0].userId);
  });

  it('the bot can win; the game ends, its win is counted and the human has no more moves', async () => {
    const id = await startBotGame(10);
    queue.push([1, 1]);
    await act(A, id, 'roll');
    queue.push([5, 5]); // bot: 10 → holding wins
    const res = await act(A, id, 'hold');
    expect(res.body.events.map((e: { type: string }) => e.type)).toEqual([
      'HOLD',
      'ROLL',
      'HOLD',
      'WIN',
    ]);
    expect(res.body.game).toMatchObject({ status: 'FINISHED', allowedActions: [] });
    expect(res.body.game.winnerId).toBe(res.body.game.players[1].userId);
    const board = (await request(app).get('/api/leaderboard').set(as(A))).body.leaderboard;
    expect(board.find((r: { username: string }) => r.username === 'bot').wins).toBe(1);
    expect(await wins(A)).toBe(0);
    expect((await act(A, id, 'roll')).body.error.code).toBe('GAME_NOT_ACTIVE');
  });

  it('does not use the bot when the human wins', async () => {
    const id = await startBotGame(10);
    queue.push([5, 5]);
    await act(A, id, 'roll');
    const res = await act(A, id, 'hold'); // queue is empty: a bot roll would throw
    expect(res.body.game.status).toBe('FINISHED');
    expect(res.body.game.winnerId).toBe(res.body.game.players[0].userId);
  });

  it("records the bot's moves in the event log under the bot", async () => {
    const id = await startBotGame();
    queue.push([2, 2]);
    await act(A, id, 'roll');
    queue.push([5, 5], [5, 5]);
    await act(A, id, 'hold');
    const rows = db
      .prepare(
        `SELECT u.username, e.type FROM game_events e JOIN users u ON u.id = e.user_id WHERE e.game_id = ? ORDER BY e.id`,
      )
      .all(id);
    expect(rows).toEqual([
      { username: 'alice', type: 'ROLL' },
      { username: 'alice', type: 'HOLD' },
      { username: 'bot', type: 'ROLL' },
      { username: 'bot', type: 'ROLL' },
      { username: 'bot', type: 'HOLD' },
    ]);
  });

  it('nobody but the human can make the bot move: the bot token does not exist, and an outsider is refused', async () => {
    const id = await startBotGame();
    expect((await act(C, id, 'roll')).status).toBe(403);
    expect((await act(B, id, 'roll')).body.error.code).toBe('NOT_A_PLAYER');
  });
});
