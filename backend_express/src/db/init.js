const { run } = require('./sqlite');

// PUBLIC_INTERFACE
async function initDb() {
  /**
   * Create required tables if they do not exist.
   * This is safe to call on every boot.
   */
  await run(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      session_id TEXT PRIMARY KEY,
      mode TEXT NOT NULL,
      speed TEXT NOT NULL,
      players_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      ended_at TEXT,
      ended_reason TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      player_id TEXT NOT NULL,
      player_name TEXT NOT NULL,
      mode TEXT NOT NULL,
      speed TEXT NOT NULL,
      score INTEGER NOT NULL,
      duration_ms INTEGER NOT NULL,
      apples INTEGER NOT NULL DEFAULT 0,
      deaths INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE SET NULL
    )
  `);

  await run(`CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_scores_player_name ON scores(player_name)`);
}

module.exports = { initDb };
