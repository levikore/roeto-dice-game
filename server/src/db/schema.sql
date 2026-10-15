CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  wins          INTEGER NOT NULL DEFAULT 0,
  is_bot        INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
  id                   TEXT PRIMARY KEY,
  status               TEXT NOT NULL CHECK (status IN ('WAITING','IN_PROGRESS','FINISHED','ABANDONED')),
  winning_score        INTEGER NOT NULL,
  current_player_index INTEGER NOT NULL DEFAULT 0 CHECK (current_player_index IN (0,1)),
  round_score          INTEGER NOT NULL DEFAULT 0,
  version              INTEGER NOT NULL DEFAULT 0,
  winner_id            TEXT REFERENCES users(id),
  locked_until         INTEGER,
  created_at           INTEGER NOT NULL,
  updated_at           INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS game_players (
  game_id      TEXT NOT NULL REFERENCES games(id),
  seat         INTEGER NOT NULL CHECK (seat IN (0,1)),
  user_id      TEXT NOT NULL REFERENCES users(id),
  global_score INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (game_id, seat),
  UNIQUE (game_id, user_id)
);

CREATE TABLE IF NOT EXISTS game_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id     TEXT NOT NULL REFERENCES games(id),
  user_id     TEXT NOT NULL REFERENCES users(id),
  type        TEXT NOT NULL CHECK (type IN ('ROLL','HOLD','BUST','WIN','ABANDON')),
  die1        INTEGER,
  die2        INTEGER,
  score_delta INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_game_events_game ON game_events(game_id, id);
