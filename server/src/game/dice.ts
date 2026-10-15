import { randomInt } from 'node:crypto';
import type { DiceRoller } from '@dice/shared';

/** Fair dice from the OS random source. Tests inject a fixed roller instead. */
export const secureDice: DiceRoller = {
  roll: () => [randomInt(1, 7), randomInt(1, 7)],
};

/**
 * Repeatable dice for end-to-end tests and demos (mulberry32 generator).
 * Never used unless DICE_SEED is set, because a seed makes every roll predictable.
 */
export function seededDice(seed: number): DiceRoller {
  let t = seed >>> 0;
  const rand = () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  const die = () => 1 + Math.floor(rand() * 6);
  return { roll: () => [die(), die()] };
}
