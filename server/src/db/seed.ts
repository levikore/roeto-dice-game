import { randomBytes, randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';

export const BOT_USERNAME = 'bot';

/** Creates the demo players and the bot. Safe to run repeatedly. */
export function seed(db: DatabaseSync, demoPassword: string): void {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO users (id, username, password_hash, is_bot, created_at) VALUES (?, ?, ?, ?, ?)',
  );
  const now = Date.now();
  for (const name of ['alice', 'bob']) {
    insert.run(randomUUID(), name, bcrypt.hashSync(demoPassword, 10), 0, now);
  }
  // The bot never logs in: its password is random and thrown away, and login skips bots.
  insert.run(
    randomUUID(),
    BOT_USERNAME,
    bcrypt.hashSync(randomBytes(24).toString('hex'), 10),
    1,
    now,
  );
}
