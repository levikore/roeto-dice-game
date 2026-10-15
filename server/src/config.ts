export const PLACEHOLDER_SECRET = 'change-me-to-a-long-random-string';

export interface Config {
  jwtSecret: string;
  port: number;
  databasePath: string;
  clientOrigin?: string;
  diceSeed?: number;
}

/** Reads settings from the environment and refuses to start with an unsafe JWT secret. */
export function loadConfig(env: Record<string, string | undefined>): Config {
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 16) {
    throw new Error(
      'Set JWT_SECRET (at least 16 characters), e.g. by copying .env.example to .env',
    );
  }
  if (jwtSecret === PLACEHOLDER_SECRET) {
    // The example value is public, so anyone could forge login tokens with it.
    throw new Error('JWT_SECRET is still the example value from .env.example; choose your own');
  }
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be a whole number from 1 to 65535, got "${env.PORT}"`);
  }
  const diceSeed = env.DICE_SEED ? Number(env.DICE_SEED) : undefined;
  if (diceSeed !== undefined && !Number.isFinite(diceSeed))
    throw new Error('DICE_SEED must be a number');
  return {
    jwtSecret,
    port,
    databasePath: env.DATABASE_PATH ?? './dev.db',
    clientOrigin: env.CLIENT_ORIGIN,
    diceSeed,
  };
}
