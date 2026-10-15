import { describe, expect, it } from 'vitest';
import type { DiceRoll, DiceRoller, GameState } from '@dice/shared';
import { applyAction, createGame } from './engine';

const A = 'alice';
const B = 'bob';

const fixed = (...rolls: DiceRoll[]): DiceRoller => {
  const queue = [...rolls];
  return {
    roll: () => {
      const next = queue.shift();
      if (!next) throw new Error('fixed dice exhausted');
      return next;
    },
  };
};

const newGame = (winningScore?: number): GameState => {
  const r = createGame('g1', [A, B], winningScore);
  if (!r.ok) throw new Error('createGame failed');
  return r.value;
};

const act = (s: GameState, type: 'ROLL' | 'HOLD', who: string, dice: DiceRoller, now?: number) =>
  applyAction(s, { type }, who, dice, now);

const ok = (r: ReturnType<typeof applyAction>) => {
  if (!r.ok) throw new Error(`expected ok, got ${r.error.code}`);
  return r.value;
};

describe('createGame (R1, R7)', () => {
  it('starts in progress with seat 0 to play and default winning score 100', () => {
    const s = newGame();
    expect(s.status).toBe('IN_PROGRESS');
    expect(s.winningScore).toBe(100);
    expect(s.currentPlayerIndex).toBe(0);
    expect(s.roundScore).toBe(0);
    expect(s.players.map((p) => p.globalScore)).toEqual([0, 0]);
  });

  it('accepts a custom winning score', () => {
    expect(newGame(50).winningScore).toBe(50);
  });

  it.each([0, 9, 1001, -5, 12.5, NaN])('rejects winning score %s', (w) => {
    const r = createGame('g', [A, B], w);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_WINNING_SCORE');
  });
});

describe('ROLL (R2, R3)', () => {
  it('adds the sum of both dice to the round score', () => {
    const { state, events } = ok(act(newGame(), 'ROLL', A, fixed([2, 3])));
    expect(state.roundScore).toBe(5);
    expect(state.currentPlayerIndex).toBe(0);
    expect(events).toEqual([{ type: 'ROLL', userId: A, dice: [2, 3], scoreDelta: 5 }]);
  });

  it('accumulates over several rolls', () => {
    let s = newGame();
    s = ok(act(s, 'ROLL', A, fixed([1, 2]))).state;
    s = ok(act(s, 'ROLL', A, fixed([4, 5]))).state;
    expect(s.roundScore).toBe(12);
  });

  it.each<[number, number]>([
    [6, 5],
    [5, 6],
    [6, 1],
  ])('does not bust on %i and %i', (a, b) => {
    const { state } = ok(act(newGame(), 'ROLL', A, fixed([a, b])));
    expect(state.currentPlayerIndex).toBe(0);
  });

  it('does not change the version-independent invariants of the other player', () => {
    const { state } = ok(act(newGame(), 'ROLL', A, fixed([3, 3])));
    expect(state.players[1].globalScore).toBe(0);
  });
});

describe('6 & 6 (R4)', () => {
  it('loses the round score and passes the turn, global score unchanged', () => {
    let s = newGame();
    s = ok(act(s, 'ROLL', A, fixed([3, 4]))).state;
    const out = ok(act(s, 'ROLL', A, fixed([6, 6]), 1000));
    expect(out.state.roundScore).toBe(0);
    expect(out.state.currentPlayerIndex).toBe(1);
    expect(out.state.players[0].globalScore).toBe(0);
    expect(out.events.map((e) => e.type)).toEqual(['BUST']);
    expect(out.events[0].dice).toEqual([6, 6]);
  });

  it('sets a short action lock (X4) that rejects actions until it ends', () => {
    const bust = ok(act(newGame(), 'ROLL', A, fixed([6, 6]), 1000)).state;
    expect(bust.lockedUntil).toBeGreaterThan(1000);
    const early = act(bust, 'ROLL', B, fixed([1, 1]), 1001);
    expect(early.ok).toBe(false);
    if (!early.ok) expect(early.error.code).toBe('ACTIONS_LOCKED');
    const late = act(bust, 'ROLL', B, fixed([1, 1]), bust.lockedUntil! + 1);
    expect(late.ok).toBe(true);
  });
});

describe('HOLD (R5)', () => {
  it('banks the round score, resets it and passes the turn', () => {
    let s = newGame();
    s = ok(act(s, 'ROLL', A, fixed([4, 6]))).state;
    const out = ok(act(s, 'HOLD', A, fixed()));
    expect(out.state.players[0].globalScore).toBe(10);
    expect(out.state.roundScore).toBe(0);
    expect(out.state.currentPlayerIndex).toBe(1);
    expect(out.events).toEqual([{ type: 'HOLD', userId: A, scoreDelta: 10 }]);
  });

  it('rejects hold with nothing to bank (A2)', () => {
    const r = act(newGame(), 'HOLD', A, fixed());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOTHING_TO_HOLD');
  });

  it('alternates turns correctly across many turns', () => {
    let s = newGame(1000);
    const seats: number[] = [];
    for (let i = 0; i < 6; i++) {
      const who = s.currentPlayerIndex === 0 ? A : B;
      s = ok(act(s, 'ROLL', who, fixed([1, 2]))).state;
      s = ok(act(s, 'HOLD', who, fixed())).state;
      seats.push(s.currentPlayerIndex);
    }
    expect(seats).toEqual([1, 0, 1, 0, 1, 0]);
  });
});

describe('winning (R6)', () => {
  const nearWin = (): GameState => {
    let s = newGame(10);
    s = ok(act(s, 'ROLL', A, fixed([5, 5]))).state;
    return s;
  };

  it('does not win on a roll alone (A1)', () => {
    expect(nearWin().status).toBe('IN_PROGRESS');
  });

  it('wins on a hold that reaches the winning score', () => {
    const out = ok(act(nearWin(), 'HOLD', A, fixed()));
    expect(out.state.status).toBe('FINISHED');
    expect(out.state.winnerId).toBe(A);
    expect(out.events.map((e) => e.type)).toEqual(['HOLD', 'WIN']);
  });

  it('wins on a hold that exceeds the winning score', () => {
    let s = newGame(10);
    s = ok(act(s, 'ROLL', A, fixed([6, 5]))).state;
    expect(ok(act(s, 'HOLD', A, fixed())).state.winnerId).toBe(A);
  });

  it('rejects any action once finished', () => {
    const done = ok(act(nearWin(), 'HOLD', A, fixed())).state;
    for (const type of ['ROLL', 'HOLD'] as const) {
      for (const who of [A, B]) {
        const r = act(done, type, who, fixed([1, 1]));
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.code).toBe('GAME_NOT_ACTIVE');
      }
    }
  });
});

describe('validation (B5)', () => {
  it('rejects the player whose turn it is not', () => {
    const r = act(newGame(), 'ROLL', B, fixed([1, 1]));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_YOUR_TURN');
  });

  it('rejects someone who is not in the game', () => {
    const r = act(newGame(), 'ROLL', 'mallory', fixed([1, 1]));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_A_PLAYER');
  });

  it('does not mutate the input state', () => {
    const s = newGame();
    const copy = structuredClone(s);
    act(s, 'ROLL', A, fixed([2, 2]));
    expect(s).toEqual(copy);
  });
});
