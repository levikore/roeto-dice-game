import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { openDb } from './db.ts';

const tables = (db: ReturnType<typeof openDb>) =>
  (
    db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[]
  )
    .map((r) => r.name)
    .sort();

describe('database schema', () => {
  it('creates all tables and is safe to apply twice', () => {
    const db = openDb(':memory:');
    db.exec(readSchemaAgain());
    expect(tables(db)).toEqual(['game_events', 'game_players', 'games', 'users']);
  });

  it('treats usernames as case-insensitively unique', () => {
    const db = openDb(':memory:');
    const ins = db.prepare(
      'INSERT INTO users (id, username, password_hash, created_at) VALUES (?,?,?,0)',
    );
    ins.run('1', 'Alice', 'h');
    expect(() => ins.run('2', 'alice', 'h')).toThrow(/UNIQUE/);
  });

  it('rejects an invalid game status', () => {
    const db = openDb(':memory:');
    expect(() =>
      db
        .prepare(
          "INSERT INTO games (id, status, winning_score, created_at, updated_at) VALUES ('g','BOGUS',100,0,0)",
        )
        .run(),
    ).toThrow(/CHECK/);
  });

  it('enforces foreign keys', () => {
    const db = openDb(':memory:');
    expect(() =>
      db
        .prepare("INSERT INTO game_players (game_id, seat, user_id) VALUES ('nope',0,'nope')")
        .run(),
    ).toThrow(/FOREIGN KEY/);
  });

  it('ignores a stale write: conditional update on version changes 0 rows', () => {
    const db = openDb(':memory:');
    db.exec(
      "INSERT INTO games (id, status, winning_score, created_at, updated_at) VALUES ('g','IN_PROGRESS',100,0,0)",
    );
    const upd = db.prepare('UPDATE games SET version = version + 1 WHERE id = ? AND version = ?');
    expect(upd.run('g', 0).changes).toBe(1);
    expect(upd.run('g', 0).changes).toBe(0);
  });
});

function readSchemaAgain(): string {
  return readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
}
