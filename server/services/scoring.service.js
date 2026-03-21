import Session from "../models/Session.model.js";

// ─────────────────────────────────────────────
// COMPONENT SCORERS — each returns a number
// ─────────────────────────────────────────────

/**
 * Score commit cadence — 25 points max
 * Rewards regular commits over dump-everything-at-end habit
 * @param {number} commitCount
 * @returns {number}
 */
const scoreCommitCadence = (commitCount) => {
  if (commitCount >= 4) return 25;
  if (commitCount === 3) return 20;
  if (commitCount === 2) return 20;
  if (commitCount === 1) return 10;
  return 0;
};

/**
 * Score error rate — 25 points max
 * Rewards clean sessions, penalizes high error density
 * @param {number} errorCount
 * @param {number} durationMinutes
 * @returns {number}
 */
const scoreErrorRate = (errorCount, durationMinutes) => {
  if (durationMinutes === 0) return 0;

  const errorsPerHour = (errorCount / durationMinutes) * 60;

  if (errorsPerHour === 0) return 25;
  if (errorsPerHour <= 3) return 20;
  if (errorsPerHour <= 6) return 15;
  if (errorsPerHour <= 9) return 8;
  return 0;
};

/**
 * Score edit velocity — 20 points max
 * Rewards active coding over passive staring
 * @param {number} keystrokeCount
 * @param {number} durationMinutes
 * @returns {number}
 */
const scoreEditVelocity = (keystrokeCount, durationMinutes) => {
  if (durationMinutes === 0) return 0;

  const keystrokesPerMinute = keystrokeCount / durationMinutes;

  if (keystrokesPerMinute >= 51) return 20;
  if (keystrokesPerMinute >= 31) return 18;
  if (keystrokesPerMinute >= 16) return 14;
  if (keystrokesPerMinute >= 6) return 8;
  return 0;
};

/**
 * Score focus depth — 20 points max
 * Rewards long uninterrupted coding blocks (flow state)
 * @param {Array} focusBlocks - Array of { start, end, durationMinutes }
 * @returns {number}
 */
const scoreFocusDepth = (focusBlocks) => {
  if (!focusBlocks || focusBlocks.length === 0) return 0;

  // Only the longest block matters — one deep focus block is what we reward
  const longestBlock = Math.max(
    ...focusBlocks.map((block) => block.durationMinutes),
  );

  if (longestBlock >= 45) return 20;
  if (longestBlock >= 30) return 18;
  if (longestBlock >= 15) return 14;
  if (longestBlock >= 5) return 8;
  return 0;
};

/**
 * Score session duration — 10 points max
 * Rewards meaningful length sessions
 * @param {number} durationMinutes
 * @returns {number}
 */
const scoreSessionDuration = (durationMinutes) => {
  if (durationMinutes >= 90) return 10;
  if (durationMinutes >= 60) return 9;
  if (durationMinutes >= 30) return 7;
  if (durationMinutes >= 15) return 4;
  return 0;
};

// ─────────────────────────────────────────────
// MASTER SCORER
// ─────────────────────────────────────────────

/**
 * Computes the full Stratum Score for a session.
 * Reads session data, runs all 5 component scorers, saves result to DB.
 *
 * @param {string} sessionId
 * @returns {Promise<Object>} Score result with breakdown
 */
const computeStratumScore = async (sessionId) => {
  const session = await Session.findOne({ sessionId });

  if (!session) {
    throw new Error(`No session found for sessionId: ${sessionId}`);
  }

  // Pull everything the scorers need from the session document
  const { durationMinutes, focusBlocks, eventBreakdown } = session;

  // Run all 5 component scorers
  const breakdown = {
    commitCadence: scoreCommitCadence(eventBreakdown.commit),
    errorRate: scoreErrorRate(eventBreakdown.error, durationMinutes),
    editVelocity: scoreEditVelocity(eventBreakdown.keystroke, durationMinutes),
    focusDepth: scoreFocusDepth(focusBlocks),
    sessionDuration: scoreSessionDuration(durationMinutes),
  };

  // Sum all components
  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  // Clamp to 0–100 just in case of any floating point edge cases
  const stratumScore = Math.min(100, Math.max(0, total));

  // Persist the score back to the session document
  await Session.findOneAndUpdate(
    { sessionId },
    {
      stratumScore,
      scored: true, // Mark as scored — won't be reprocessed unless rebuilt
    },
  );

  return {
    sessionId,
    stratumScore,
    breakdown, // Frontend uses this to show "why you got this score"
    interpretation: interpretScore(stratumScore),
  };
};

/**
 * Returns a human readable interpretation of the score.
 * Used by the frontend and will power natural language summaries in V3.
 * @param {number} score
 * @returns {string}
 */
const interpretScore = (score) => {
  if (score >= 90)
    return "Elite session — peak focus, clean code, great habits";
  if (score >= 75) return "Strong session — solid productivity";
  if (score >= 60) return "Decent session — room to improve";
  if (score >= 40) return "Weak session — distracted or struggling";
  return "Poor session — burnout signal, investigate why";
};

export {
  computeStratumScore,
  // Export individual scorers for unit testing in V2
  scoreCommitCadence,
  scoreErrorRate,
  scoreEditVelocity,
  scoreFocusDepth,
  scoreSessionDuration,
};
