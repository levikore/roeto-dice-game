import { describe, expect, it } from 'vitest';
import { secureDice, seededDice } from './dice.ts';

const rolls = (r: { roll: () => [number, number] }, n: number) =>
  Array.from({ length: n }, () => r.roll());

describe('dice', () => {
  it('seeded dice repeat for the same seed and differ for another', () => {
    expect(rolls(seededDice(7), 20)).toEqual(rolls(seededDice(7), 20));
    expect(rolls(seededDice(7), 20)).not.toEqual(rolls(seededDice(8), 20));
  });

  it.each([
    ['seeded', () => seededDice(1)],
    ['secure', () => secureDice],
  ])('%s dice only produce faces 1 to 6 and use every face', (_n, make) => {
    const seen = new Set<number>();
    for (const [a, b] of rolls(make(), 2000)) {
      expect(Number.isInteger(a) && Number.isInteger(b)).toBe(true);
      expect(Math.min(a, b)).toBeGreaterThanOrEqual(1);
      expect(Math.max(a, b)).toBeLessThanOrEqual(6);
      seen.add(a).add(b);
    }
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
