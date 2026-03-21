import Insight from "../models/Insight.model.js";
import Session from "../models/Session.model.js";
import { getCache, setCache, invalidateCache, TTL } from "../utils/cache.js";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Returns the Monday of the week containing the given date.
 * All insight documents are keyed to Monday for consistent querying.
 * @param {Date} date
 * @returns {Date} Monday 00:00:00 of that week
 */
const getMondayOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Maps a Date to the day name for scoreBreakdown.
 * @param {Date} date
 * @returns {string} e.g. 'monday', 'tuesday'
 */
const getDayName = (date) => {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[new Date(date).getDay()];
};

// ─────────────────────────────────────────────
// ANALYZERS
// ─────────────────────────────────────────────

/**
 * Finds peak coding hours from a set of sessions.
 * Groups sessions by start hour, averages Stratum Score per hour,
 * returns top 3 hours sorted by average score descending.
 * @param {Array} sessions
 * @returns {Array} e.g. [10, 14, 9]
 */
const computePeakHours = (sessions) => {
  const hourMap = {}; // { hour: { totalScore, count } }

  sessions.forEach((session) => {
    if (session.stratumScore === null) return; // Skip unscored sessions

    const hour = new Date(session.startTime).getHours();

    if (!hourMap[hour]) {
      hourMap[hour] = { totalScore: 0, count: 0 };
    }

    hourMap[hour].totalScore += session.stratumScore;
    hourMap[hour].count++;
  });

  // Convert to array, compute averages, sort by avg score descending
  const hourAverages = Object.entries(hourMap).map(([hour, data]) => ({
    hour: parseInt(hour),
    avgScore: data.totalScore / data.count,
  }));

  hourAverages.sort((a, b) => b.avgScore - a.avgScore);

  // Return top 3 peak hours
  return hourAverages.slice(0, 3).map((h) => h.hour);
};

/**
 * Computes burnout risk score (0-100) from session patterns.
 * Three signals: high error rate, declining scores, very long sessions.
 * @param {Array} sessions
 * @returns {{ score: number, level: string }}
 */
const computeBurnoutRisk = (sessions) => {
  if (sessions.length === 0) return { score: 0, level: "low" };

  let riskScore = 0;

  // Signal 1 — High error rate across sessions (max 40 pts)
  const totalErrors = sessions.reduce(
    (sum, s) => sum + (s.eventBreakdown?.error || 0),
    0,
  );
  const totalDuration = sessions.reduce(
    (sum, s) => sum + (s.durationMinutes || 0),
    0,
  );
  const errorsPerHour =
    totalDuration > 0 ? (totalErrors / totalDuration) * 60 : 0;

  if (errorsPerHour >= 10) riskScore += 40;
  else if (errorsPerHour >= 7) riskScore += 28;
  else if (errorsPerHour >= 4) riskScore += 15;

  // Signal 2 — Declining Stratum Scores (max 40 pts)
  // Compare average of first half of week vs second half
  const scoredSessions = sessions.filter((s) => s.stratumScore !== null);
  if (scoredSessions.length >= 2) {
    const half = Math.floor(scoredSessions.length / 2);
    const firstHalf = scoredSessions.slice(0, half);
    const secondHalf = scoredSessions.slice(half);

    const avgFirst =
      firstHalf.reduce((sum, s) => sum + s.stratumScore, 0) / firstHalf.length;
    const avgSecond =
      secondHalf.reduce((sum, s) => sum + s.stratumScore, 0) /
      secondHalf.length;
    const decline = avgFirst - avgSecond;

    if (decline >= 20) riskScore += 40;
    else if (decline >= 10) riskScore += 25;
    else if (decline >= 5) riskScore += 10;
  }

  // Signal 3 — Very long sessions (max 20 pts)
  // Coding > 3hrs straight is a burnout signal
  const longSessions = sessions.filter((s) => s.durationMinutes > 180);
  if (longSessions.length >= 3) riskScore += 20;
  else if (longSessions.length >= 2) riskScore += 12;
  else if (longSessions.length === 1) riskScore += 5;

  // Clamp to 0-100
  const finalScore = Math.min(100, Math.max(0, riskScore));

  // Map to level
  let level = "low";
  if (finalScore >= 75) level = "critical";
  else if (finalScore >= 50) level = "high";
  else if (finalScore >= 25) level = "moderate";

  return { score: finalScore, level };
};

/**
 * Detects behavioral patterns from sessions and returns
 * human readable observations for the frontend.
 * @param {Array} sessions
 * @param {Array} peakHours
 * @param {{ score: number, level: string }} burnoutRisk
 * @returns {Array} Array of pattern objects
 */
const detectPatterns = (sessions, peakHours, burnoutRisk) => {
  const patterns = [];

  // Pattern 1 — Peak hour callout
  if (peakHours.length > 0) {
    patterns.push({
      type: "peak_hour",
      message: `Your peak coding hour is ${peakHours[0]}:00 — schedule deep work here`,
      severity: "info",
    });
  }

  // Pattern 2 — Burnout risk alert
  if (burnoutRisk.level === "critical") {
    patterns.push({
      type: "burnout_risk",
      message: "Critical burnout risk detected — consider taking a break",
      severity: "critical",
    });
  } else if (burnoutRisk.level === "high") {
    patterns.push({
      type: "burnout_risk",
      message: "High burnout risk — your productivity signals are declining",
      severity: "warning",
    });
  }

  // Pattern 3 — Score trend
  const scoredSessions = sessions.filter((s) => s.stratumScore !== null);
  if (scoredSessions.length >= 2) {
    const first = scoredSessions[0].stratumScore;
    const last = scoredSessions[scoredSessions.length - 1].stratumScore;
    const trend = last - first;

    if (trend >= 10) {
      patterns.push({
        type: "score_improvement",
        message: `Your Stratum Score improved by ${trend} points this week`,
        severity: "info",
      });
    } else if (trend <= -10) {
      patterns.push({
        type: "score_decline",
        message: `Your Stratum Score dropped by ${Math.abs(trend)} points this week`,
        severity: "warning",
      });
    }
  }

  // Pattern 4 — Low activity
  if (sessions.length <= 2) {
    patterns.push({
      type: "low_activity",
      message: `Low activity this week — only ${sessions.length} session(s) recorded`,
      severity: "info",
    });
  }

  // Pattern 5 — High error rate
  const totalErrors = sessions.reduce(
    (sum, s) => sum + (s.eventBreakdown?.error || 0),
    0,
  );
  if (totalErrors > 20) {
    patterns.push({
      type: "high_error_rate",
      message: `${totalErrors} errors recorded this week — review your debugging workflow`,
      severity: "warning",
    });
  }

  return patterns;
};

/**
 * Builds daily score breakdown for the weekly trend chart.
 * @param {Array} sessions
 * @returns {Object} { monday: avg, tuesday: avg, ... }
 */
const buildScoreBreakdown = (sessions) => {
  const breakdown = {
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
    sunday: null,
  };

  const dayMap = {};

  sessions.forEach((session) => {
    if (session.stratumScore === null) return;
    const day = getDayName(session.startTime);
    if (!dayMap[day]) dayMap[day] = { total: 0, count: 0 };
    dayMap[day].total += session.stratumScore;
    dayMap[day].count++;
  });

  Object.entries(dayMap).forEach(([day, data]) => {
    breakdown[day] = Math.round(data.total / data.count);
  });

  return breakdown;
};

// ─────────────────────────────────────────────
// MASTER FUNCTION
// ─────────────────────────────────────────────

/**
 * Builds and persists a weekly insight document for a user.
 * Safe to re-run — uses upsert on userId + weekOf.
 * @param {string} userId
 * @param {Date} date - Any date within the target week
 * @returns {Promise<Object>} The saved insight document
 */
const buildWeeklyInsight = async (userId, date) => {
  const weekOf = getMondayOfWeek(date || new Date());

  // Get the Sunday of this week for the range end
  const weekEnd = new Date(weekOf);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Fetch all sessions for this user this week
  const sessions = await Session.find({
    userId,
    startTime: { $gte: weekOf, $lte: weekEnd },
  }).sort({ startTime: 1 }); // Oldest first for trend analysis

  // Run all analyzers
  const peakHours = computePeakHours(sessions);
  const burnoutRisk = computeBurnoutRisk(sessions);
  const patterns = detectPatterns(sessions, peakHours, burnoutRisk);
  const scoreBreakdown = buildScoreBreakdown(sessions);

  // Compute total focus time across all sessions
  const totalFocusTime = sessions.reduce((sum, session) => {
    const sessionFocus = session.focusBlocks.reduce(
      (blockSum, block) => blockSum + block.durationMinutes,
      0,
    );
    return sum + sessionFocus;
  }, 0);

  // Compute average Stratum Score
  const scoredSessions = sessions.filter((s) => s.stratumScore !== null);
  const averageStratumScore =
    scoredSessions.length > 0
      ? Math.round(
          scoredSessions.reduce((sum, s) => sum + s.stratumScore, 0) /
            scoredSessions.length,
        )
      : null;

  // Upsert — safe to rebuild anytime
  const insight = await Insight.findOneAndUpdate(
    { userId, weekOf },
    {
      userId,
      weekOf,
      totalSessions: sessions.length,
      totalFocusTime,
      averageStratumScore,
      peakHours,
      burnoutRiskScore: burnoutRisk.score,
      burnoutRiskLevel: burnoutRisk.level,
      patterns,
      scoreBreakdown,
    },
    { upsert: true, new: true },
  );

  // Invalidate insights cache for this user
  await invalidateCache(`insights:${userId}:*`);

  return insight;
};

/**
 * Retrieves all weekly insights for a user, newest first.
 * @param {string} userId
 * @param {number} limit - How many weeks to return (default 8 = 2 months)
 * @returns {Promise<Array>}
 */
const getInsightsByUser = async (userId, limit = 8) => {
  const cacheKey = `insights:${userId}:all:${limit}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`[cache] ✅ HIT — ${cacheKey}`);
    return cached;
  }

  const insights = await Insight.find({ userId })
    .sort({ weekOf: -1 })
    .limit(limit);

  await setCache(cacheKey, insights, TTL.INSIGHTS);
  console.log(`[cache] 💾 SET — ${cacheKey}`);

  return insights;
};

/**
 * Retrieves insight for a specific week.
 * @param {string} userId
 * @param {Date} date - Any date within the target week
 * @returns {Promise<Object|null>}
 */
const getInsightForWeek = async (userId, date) => {
  const weekOf = getMondayOfWeek(date);
  const cacheKey = `insights:${userId}:week:${weekOf.toISOString()}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`[cache] ✅ HIT — ${cacheKey}`);
    return cached;
  }

  const insight = await Insight.findOne({ userId, weekOf });

  if (insight) {
    await setCache(cacheKey, insight, TTL.INSIGHTS);
    console.log(`[cache] 💾 SET — ${cacheKey}`);
  }

  return insight;
};

export {
  buildWeeklyInsight,
  getInsightsByUser,
  getInsightForWeek,
  getMondayOfWeek, // Exported for use in controller date parsing
};
