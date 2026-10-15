import { randomInt } from 'node:crypto';
import type { DiceRoller } from '@dice/shared';

/** Fair dice from the OS random source. Tests inject a fixed roller instead. */
export const secureDice: DiceRoller = {
  roll: () => [randomInt(1, 7), randomInt(1, 7)],
};
