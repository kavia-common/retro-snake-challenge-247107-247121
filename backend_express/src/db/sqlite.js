const path = require('path');
const sqlite3 = require('sqlite3').verbose();

/**
 * Resolve SQLite DB path from env (SQLITE_DB).
 * NOTE: SQLITE_DB is managed by the environment system; request it if missing.
 */
function resolveDbPath() {
  const p = process.env.SQLITE_DB;
  if (!p) {
    // Fallback: allow local dev when env is absent (keeps backend running).
    return path.resolve(process.cwd(), 'data.db');
  }
  return p.replace(/^"|"$/g, '');
}

let _db = null;

// PUBLIC_INTERFACE
function getDb() {
  /**
   * Returns a singleton sqlite3.Database connection.
   * Ensures foreign keys are enabled.
   */
  if (_db) return _db;
  const dbPath = resolveDbPath();
  _db = new sqlite3.Database(dbPath);
  _db.exec('PRAGMA foreign_keys = ON;');
  return _db;
}

// PUBLIC_INTERFACE
function run(sql, params = []) {
  /** Execute a statement and return { lastID, changes }. */
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// PUBLIC_INTERFACE
function get(sql, params = []) {
  /** Get a single row. */
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

// PUBLIC_INTERFACE
function all(sql, params = []) {
  /** Get all rows. */
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

module.exports = {
  getDb,
  run,
  get,
  all,
};
