import type { DiceRoll, GameState } from '@dice/shared';
import { describe, expect, it } from 'vitest';
import { chooseAction } from './bot.ts';
import { applyAction, createGame } from './engine.ts';

const state = (o: { me?: number; opp?: number; round?: number; win?: number }): GameState => ({
  id: 'g',
  status: 'IN_PROGRESS',
  winningScore: o.win ?? 100,
  players: [
    { userId: 'bot', globalScore: o.me ?? 0 },
    { userId: 'human', globalScore: o.opp ?? 0 },
  ],
  currentPlayerIndex: 0,
  roundScore: o.round ?? 0,
  version: 0,
});

describe('chooseAction', () => {
  it('rolls when there is nothing to bank', () => {
    expect(chooseAction(state({ round: 0 }), 'bot')).toBe('ROLL');
  });

  it('keeps rolling below the hold threshold and holds at it', () => {
    expect(chooseAction(state({ round: 19 }), 'bot')).toBe('ROLL');
    expect(chooseAction(state({ round: 20 }), 'bot')).toBe('HOLD');
    expect(chooseAction(state({ round: 35 }), 'bot')).toBe('HOLD');
  });

  it('holds as soon as holding wins the game, even with a small round score', () => {
    expect(chooseAction(state({ me: 95, round: 5 }), 'bot')).toBe('HOLD');
    expect(chooseAction(state({ me: 95, round: 4 }), 'bot')).toBe('ROLL');
  });

  it('takes more risk when the opponent is close to winning and ahead', () => {
    expect(chooseAction(state({ me: 40, opp: 85, round: 25 }), 'bot')).toBe('ROLL');
    expect(chooseAction(state({ me: 40, opp: 85, round: 30 }), 'bot')).toBe('HOLD');
  });

  it('does not take extra risk when the opponent is close but the bot is ahead', () => {
    expect(chooseAction(state({ me: 90, opp: 85, round: 20 }), 'bot')).toBe('HOLD');
  });

  it('works from either seat and never returns HOLD with a round score of 0', () => {
    const s = state({ round: 0 });
    s.players.reverse();
    s.currentPlayerIndex = 1;
    expect(chooseAction(s, 'bot')).toBe('ROLL');
  });

  it('falls back to ROLL if the bot is not in the game', () => {
    expect(chooseAction(state({ round: 50 }), 'stranger')).toBe('ROLL');
  });
});

// Seeded generator so the simulation is repeatable.
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

describe('simulation: bot vs a random player', () => {
  it('wins clearly more than half of 1000 games, playing only legal moves', () => {
    const rand = rng(2026);
    const die = () => 1 + Math.floor(rand() * 6);
    const dice = { roll: (): DiceRoll => [die(), die()] };
    let botWins = 0;
    const N = 1000;

    for (let g = 0; g < N; g++) {
      // Alternate who sits first so neither side gets the starting advantage every time.
      const ids: [string, string] = g % 2 === 0 ? ['bot', 'rnd'] : ['rnd', 'bot'];
      const created = createGame(`g${g}`, ids, 100);
      if (!created.ok) throw new Error('createGame failed');
      let s = created.value;
      let now = 0;
      let moves = 0;
      while (s.status === 'IN_PROGRESS') {
        if (++moves > 10_000) throw new Error('game did not finish');
        const actor = s.players[s.currentPlayerIndex].userId;
        const type =
          actor === 'bot'
            ? chooseAction(s, 'bot')
            : s.roundScore > 0 && rand() < 0.5
              ? 'HOLD'
              : 'ROLL';
        now += 2000;
        const r = applyAction(s, { type }, actor, dice, now);
        if (!r.ok) throw new Error(`illegal move by ${actor}: ${type} -> ${r.error.code}`);
        s = r.value.state;
      }
      if (s.winnerId === 'bot') botWins++;
    }
    const rate = botWins / N;
    console.log(`bot win rate vs random: ${(rate * 100).toFixed(1)}%`);
    expect(rate).toBeGreaterThan(0.6);
  });
});
