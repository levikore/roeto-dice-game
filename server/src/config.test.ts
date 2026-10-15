import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_SECRET, loadConfig } from './config.ts';

const ok = { JWT_SECRET: 'a-real-secret-of-sufficient-length' };

describe('loadConfig', () => {
  it('accepts a good secret and applies defaults', () => {
    expect(loadConfig(ok)).toMatchObject({
      port: 3000,
      databasePath: './dev.db',
      diceSeed: undefined,
    });
  });

  it.each([undefined, '', 'short'])('refuses a missing or short JWT_SECRET (%j)', (secret) => {
    expect(() => loadConfig({ JWT_SECRET: secret })).toThrow(/JWT_SECRET/);
  });

  it('refuses the public example secret from .env.example', () => {
    expect(() => loadConfig({ JWT_SECRET: PLACEHOLDER_SECRET })).toThrow(/example value/);
  });

  it.each(['abc', '0', '70000', '3000.5'])('refuses a bad PORT (%s)', (port) => {
    expect(() => loadConfig({ ...ok, PORT: port })).toThrow(/PORT/);
  });

  it('reads the test dice seed and rejects a non-number', () => {
    expect(loadConfig({ ...ok, DICE_SEED: '7' }).diceSeed).toBe(7);
    expect(() => loadConfig({ ...ok, DICE_SEED: 'x' })).toThrow(/DICE_SEED/);
  });
});
