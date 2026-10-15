import type { DiceRoll, DiceRoller } from '@dice/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { openDb } from '../db/db.ts';
import { seed } from '../db/seed.ts';
import { ApiError } from '../http/errors.ts';
import { createGameService } from './service.ts';

let db: ReturnType<typeof openDb>;
let queue: DiceRoll[];
let clock: number;
let svc: ReturnType<typeof createGameService>;
let alice: string;
let bob: string;

const dice: DiceRoller = {
  roll: () => {
    const next = queue.shift();
    if (!next) throw new Error('fixed dice exhausted');
    return next;
  },
};
const id = (name: string) =>
  (db.prepare('SELECT id FROM users WHERE username = ?').get(name) as { id: string }).id;
const codeOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    if (e instanceof ApiError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
};
const startHumanGame = (winningScore = 50) => {
  const g = svc.create(alice, { winningScore });
  return svc.join(g.id, bob);
};

beforeEach(() => {
  db = openDb(':memory:');
  seed(db, 'demo1234');
  queue = [];
  clock = 1_000_000;
  svc = createGameService({ db, dice, now: () => clock });
  alice = id('alice');
  bob = id('bob');
});

describe('create / join', () => {
  it('creates a waiting game with one player and no allowed actions', () => {
    const g = svc.create(alice, {});
    expect(g.status).toBe('WAITING');
    expect(g.winningScore).toBe(100);
    expect(g.players.map((p) => p.username)).toEqual(['alice']);
    expect(g.allowedActions).toEqual([]);
    expect(g.currentPlayerId).toBeNull();
  });

  it('starts when the second player joins, creator first', () => {
    const g = startHumanGame();
    expect(g.status).toBe('IN_PROGRESS');
    expect(g.players.map((p) => p.username)).toEqual(['alice', 'bob']);
    expect(g.currentPlayerId).toBe(alice);
    expect(g.allowedActions).toEqual(['ROLL']);
  });

  it('starts a bot game immediately', () => {
    const g = svc.create(alice, { opponent: 'bot', winningScore: 20 });
    expect(g.status).toBe('IN_PROGRESS');
    expect(g.players.map((p) => p.username)).toEqual(['alice', 'bot']);
  });

  it.each([0, 5, 1001, 12.5])('rejects winning score %s', (w) => {
    expect(codeOf(() => svc.create(alice, { winningScore: w }))).toBe('INVALID_WINNING_SCORE');
  });

  it('rejects joining your own game, a full game and an unknown game', () => {
    const g = svc.create(alice, {});
    expect(codeOf(() => svc.join(g.id, alice))).toBe('ALREADY_IN_GAME');
    svc.join(g.id, bob);
    expect(codeOf(() => svc.join(g.id, bob))).toBe('GAME_NOT_JOINABLE');
    expect(codeOf(() => svc.join('missing', bob))).toBe('GAME_NOT_FOUND');
  });
});

describe('get', () => {
  it('lets players read and blocks outsiders', () => {
    const g = startHumanGame();
    expect(svc.get(g.id, bob).id).toBe(g.id);
    const mallory = (
      db.prepare('SELECT id FROM users WHERE username = ?').get('bot') as { id: string }
    ).id;
    expect(codeOf(() => svc.get(g.id, mallory))).toBe('NOT_A_PLAYER');
    expect(codeOf(() => svc.get('missing', alice))).toBe('GAME_NOT_FOUND');
  });
});

describe('act', () => {
  it('rolls, saves state, records an event and bumps the version', () => {
    const g = startHumanGame();
    queue.push([3, 4]);
    const r = svc.act(g.id, alice, { type: 'ROLL' });
    expect(r.game.roundScore).toBe(7);
    expect(r.game.version).toBe(g.version + 1);
    expect(r.game.allowedActions).toEqual(['ROLL', 'HOLD']);
    expect(r.events).toEqual([{ type: 'ROLL', userId: alice, dice: [3, 4], scoreDelta: 7 }]);
    const stored = db.prepare('SELECT type, die1, die2, score_delta FROM game_events').all();
    expect(stored).toEqual([{ type: 'ROLL', die1: 3, die2: 4, score_delta: 7 }]);
  });

  it('holds: banks the score and passes the turn, persisted', () => {
    const g = startHumanGame();
    queue.push([5, 5]);
    svc.act(g.id, alice, { type: 'ROLL' });
    const r = svc.act(g.id, alice, { type: 'HOLD' });
    expect(r.game.players[0].globalScore).toBe(10);
    expect(r.game.currentPlayerId).toBe(bob);
    expect(svc.get(g.id, bob).players[0].globalScore).toBe(10);
  });

  it('6&6 clears the round, passes the turn and locks actions until the clock moves on', () => {
    const g = startHumanGame();
    queue.push([6, 6]);
    const r = svc.act(g.id, alice, { type: 'ROLL' });
    expect(r.game.currentPlayerId).toBe(bob);
    expect(r.game.lockRemainingMs).toBe(1500);
    expect(r.game.allowedActions).toEqual([]);
    expect(codeOf(() => svc.act(g.id, bob, { type: 'ROLL' }))).toBe('ACTIONS_LOCKED');
    clock += 1500;
    queue.push([1, 1]);
    expect(svc.act(g.id, bob, { type: 'ROLL' }).game.roundScore).toBe(2);
  });

  it('maps engine errors to the right codes', () => {
    const g = startHumanGame();
    expect(codeOf(() => svc.act(g.id, bob, { type: 'ROLL' }))).toBe('NOT_YOUR_TURN');
    expect(codeOf(() => svc.act(g.id, alice, { type: 'HOLD' }))).toBe('NOTHING_TO_HOLD');
    const waiting = svc.create(alice, {});
    expect(codeOf(() => svc.act(waiting.id, alice, { type: 'ROLL' }))).toBe('GAME_NOT_ACTIVE');
    expect(codeOf(() => svc.act('missing', alice, { type: 'ROLL' }))).toBe('GAME_NOT_FOUND');
  });

  it('blocks outsiders before the engine sees the action', () => {
    const g = startHumanGame();
    const botId = id('bot');
    expect(codeOf(() => svc.act(g.id, botId, { type: 'ROLL' }))).toBe('NOT_A_PLAYER');
  });

  it('rejects a stale expectedVersion and saves nothing', () => {
    const g = startHumanGame();
    queue.push([2, 2], [2, 2]);
    svc.act(g.id, alice, { type: 'ROLL' }, g.version);
    expect(codeOf(() => svc.act(g.id, alice, { type: 'ROLL' }, g.version))).toBe('STALE_VERSION');
    expect(svc.get(g.id, alice).roundScore).toBe(4);
    expect(queue).toHaveLength(1); // second request failed before any dice were rolled
  });

  it('rolls back everything when a step fails mid-transaction', () => {
    const g = startHumanGame();
    queue.push([2, 3]);
    db.exec('DROP TABLE game_events'); // force a failure after the game row is updated
    expect(() => svc.act(g.id, alice, { type: 'ROLL' })).toThrow();
    expect(svc.get(g.id, alice).roundScore).toBe(0);
  });
});
