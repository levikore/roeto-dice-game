import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { GameEvent, GameState } from '@dice/shared';
import { applyAction, createGame } from './engine';

const A = 'alice';
const B = 'bob';

const die = fc.integer({ min: 1, max: 6 });
const step = fc.record({
  type: fc.constantFrom('ROLL' as const, 'HOLD' as const),
  actor: fc.constantFrom(A, B, 'mallory'),
  d1: die,
  d2: die,
});

describe('engine invariants over random action sequences', () => {
  it('holds for 1000+ random games', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 200 }),
        fc.array(step, { minLength: 1, maxLength: 200 }),
        (winningScore, steps) => {
          const created = createGame('g', [A, B], winningScore);
          if (!created.ok) throw new Error('createGame failed');
          let state: GameState = created.value;
          const events: GameEvent[] = [];
          let now = 0;

          for (const s of steps) {
            const before = state;
            now += 2000; // always past any bust lock
            const r = applyAction(
              state,
              { type: s.type },
              s.actor,
              { roll: () => [s.d1, s.d2] },
              now,
            );

            if (before.status !== 'IN_PROGRESS') {
              // no actions accepted after the game ends
              expect(r.ok).toBe(false);
              continue;
            }
            if (!r.ok) {
              expect(r.error.code).toBeTruthy();
              continue;
            }
            state = r.value.state;
            events.push(...r.value.events);

            expect(state.version).toBe(before.version + 1);
            expect(state.roundScore).toBeGreaterThanOrEqual(0);
            for (const p of state.players) expect(p.globalScore).toBeGreaterThanOrEqual(0);
            if (state.currentPlayerIndex !== before.currentPlayerIndex) {
              expect(state.roundScore).toBe(0); // a fresh turn always starts at 0
            }
          }

          const banked = events
            .filter((e) => e.type === 'HOLD')
            .reduce((n, e) => n + e.scoreDelta, 0);
          const total = state.players.reduce((n, p) => n + p.globalScore, 0);
          expect(total).toBe(banked);

          const wins = events.filter((e) => e.type === 'WIN');
          expect(wins.length).toBeLessThanOrEqual(1);
          if (state.status === 'FINISHED') {
            expect(wins).toHaveLength(1);
            const winner = state.players.find((p) => p.userId === state.winnerId);
            expect(winner?.globalScore).toBeGreaterThanOrEqual(winningScore);
          } else {
            expect(state.winnerId).toBeUndefined();
            for (const p of state.players) expect(p.globalScore).toBeLessThan(winningScore);
          }
        },
      ),
      { numRuns: 1000 },
    );
  });
});
