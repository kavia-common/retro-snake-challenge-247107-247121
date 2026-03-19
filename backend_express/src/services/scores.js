const crypto = require('crypto');
const { all, get, run } = require('../db/sqlite');

function nowIso() {
  return new Date().toISOString();
}

function makeSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

// PUBLIC_INTERFACE
async function createSession({ mode, speed, players }) {
  /** Create a game session record; returns { session_id, created_at }. */
  const session_id = makeSessionId();
  const created_at = nowIso();
  await run(
    `INSERT INTO game_sessions(session_id, mode, speed, players_json, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [session_id, mode, speed, JSON.stringify(players || []), created_at],
  );
  return { session_id, created_at, mode, speed, players: players || [] };
}

// PUBLIC_INTERFACE
async function submitScores({ session_id, mode, speed, ended_reason, results }) {
  /**
   * Persist one or more player results. If session_id provided, marks session ended.
   * results: [{player_id,name,score,duration_ms,apples,deaths}]
   */
  const created_at = nowIso();

  if (session_id) {
    await run(
      `UPDATE game_sessions SET ended_at = ?, ended_reason = ? WHERE session_id = ?`,
      [created_at, ended_reason || null, session_id],
    );
  }

  const inserted = [];
  for (const r of results || []) {
    const row = {
      session_id: session_id || null,
      player_id: r.player_id,
      player_name: r.name,
      mode,
      speed,
      score: Number.isFinite(r.score) ? r.score : 0,
      duration_ms: Number.isFinite(r.duration_ms) ? r.duration_ms : 0,
      apples: Number.isFinite(r.apples) ? r.apples : 0,
      deaths: Number.isFinite(r.deaths) ? r.deaths : 0,
      created_at,
    };

    const res = await run(
      `INSERT INTO scores(session_id, player_id, player_name, mode, speed, score, duration_ms, apples, deaths, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.session_id,
        row.player_id,
        row.player_name,
        row.mode,
        row.speed,
        row.score,
        row.duration_ms,
        row.apples,
        row.deaths,
        row.created_at,
      ],
    );
    inserted.push({ id: res.lastID, ...row });
  }

  return { inserted_count: inserted.length, created_at };
}

// PUBLIC_INTERFACE
async function getLeaderboard({ limit }) {
  /** Return top scores across all modes/speeds. */
  const lim = Math.max(1, Math.min(100, Number(limit) || 10));
  const items = await all(
    `SELECT player_name, mode, speed, score, duration_ms, apples, deaths, created_at
     FROM scores
     ORDER BY score DESC, duration_ms ASC, created_at ASC
     LIMIT ?`,
    [lim],
  );
  return { items };
}

// PUBLIC_INTERFACE
async function getStats() {
  /** Return aggregate stats for sidebar. */
  const gamesTotal = await get(`SELECT COUNT(*) AS c FROM game_sessions`, []);
  const scoresTotal = await get(`SELECT COUNT(*) AS c FROM scores`, []);
  const topScore = await get(`SELECT MAX(score) AS m FROM scores`, []);
  const lastPlayed = await get(`SELECT MAX(created_at) AS last FROM scores`, []);

  return {
    games_total: gamesTotal?.c || 0,
    scores_total: scoresTotal?.c || 0,
    top_score: topScore?.m || 0,
    last_played_at: lastPlayed?.last || null,
  };
}

module.exports = {
  createSession,
  submitScores,
  getLeaderboard,
  getStats,
};
