const express = require('express');
const scoresService = require('../services/scores');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Game
 *     description: Game sessions and score submission
 *   - name: Leaderboard
 *     description: High scores and aggregated stats
 */

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     tags: [Game]
 *     summary: Create a new game session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mode, speed, players]
 *             properties:
 *               mode:
 *                 type: string
 *                 example: single
 *               speed:
 *                 type: string
 *                 example: normal
 *               players:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [player_id, name]
 *                   properties:
 *                     player_id:
 *                       type: string
 *                       example: P1
 *                     name:
 *                       type: string
 *                       example: PLAYER
 *     responses:
 *       200:
 *         description: Created session
 */
router.post('/sessions', async (req, res, next) => {
  try {
    const { mode, speed, players } = req.body || {};
    if (!mode || !speed || !Array.isArray(players) || players.length < 1) {
      return res.status(400).json({ error: 'Invalid payload: mode, speed, players[] required' });
    }
    const created = await scoresService.createSession({ mode, speed, players });
    return res.status(200).json(created);
  } catch (e) {
    return next(e);
  }
});

/**
 * @swagger
 * /api/scores:
 *   post:
 *     tags: [Game]
 *     summary: Submit final scores for a session
 *     description: Stores one or more player results and updates leaderboard.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mode, speed, results]
 *             properties:
 *               session_id:
 *                 type: string
 *                 nullable: true
 *               mode:
 *                 type: string
 *                 example: versus
 *               speed:
 *                 type: string
 *                 example: fast
 *               ended_reason:
 *                 type: string
 *                 example: dead
 *               results:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [player_id, name, score, duration_ms, apples, deaths]
 *                   properties:
 *                     player_id: { type: string, example: P1 }
 *                     name: { type: string, example: PLAYER 1 }
 *                     score: { type: integer, example: 120 }
 *                     duration_ms: { type: integer, example: 45123 }
 *                     apples: { type: integer, example: 12 }
 *                     deaths: { type: integer, example: 2 }
 *     responses:
 *       200:
 *         description: Insert summary
 */
router.post('/scores', async (req, res, next) => {
  try {
    const { session_id, mode, speed, ended_reason, results } = req.body || {};
    if (!mode || !speed || !Array.isArray(results) || results.length < 1) {
      return res.status(400).json({ error: 'Invalid payload: mode, speed, results[] required' });
    }
    for (const r of results) {
      if (!r || !r.player_id || !r.name) {
        return res.status(400).json({ error: 'Invalid results: each requires player_id and name' });
      }
    }
    const out = await scoresService.submitScores({ session_id, mode, speed, ended_reason, results });
    return res.status(200).json(out);
  } catch (e) {
    return next(e);
  }
});

/**
 * @swagger
 * /api/leaderboard:
 *   get:
 *     tags: [Leaderboard]
 *     summary: Get top scores
 *     parameters:
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: Leaderboard items
 */
router.get('/leaderboard', async (req, res, next) => {
  try {
    const { limit } = req.query || {};
    const out = await scoresService.getLeaderboard({ limit });
    return res.status(200).json(out);
  } catch (e) {
    return next(e);
  }
});

/**
 * @swagger
 * /api/stats:
 *   get:
 *     tags: [Leaderboard]
 *     summary: Get aggregated game statistics
 *     responses:
 *       200:
 *         description: Stats
 */
router.get('/stats', async (req, res, next) => {
  try {
    const out = await scoresService.getStats();
    return res.status(200).json(out);
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
