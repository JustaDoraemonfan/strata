import Session from "../models/Session.model.js";
import { getEventsBySession } from "./events.service.js";
import { getCache, setCache, invalidateCache, TTL } from "../utils/cache.js";

const INTERRUPTION_THRESHOLD_MS = 5 * 60 * 1000;

const analyzeFocusPatterns = (events) => {
  const focusBlocks = [];
  let interruptionCount = 0;

  if (events.length < 2) return { focusBlocks, interruptionCount };

  let blockStart = new Date(events[0].timestamp);
  let blockEnd = new Date(events[0].timestamp);

  for (let i = 1; i < events.length; i++) {
    const current = new Date(events[i].timestamp);
    const previous = new Date(events[i - 1].timestamp);
    const gap = current - previous;

    if (gap > INTERRUPTION_THRESHOLD_MS) {
      const durationMinutes = Math.round((blockEnd - blockStart) / 60000);
      if (durationMinutes > 0) {
        focusBlocks.push({ start: blockStart, end: blockEnd, durationMinutes });
      }
      interruptionCount++;
      blockStart = current;
    }
    blockEnd = current;
  }

  const finalDuration = Math.round((blockEnd - blockStart) / 60000);
  if (finalDuration > 0) {
    focusBlocks.push({
      start: blockStart,
      end: blockEnd,
      durationMinutes: finalDuration,
    });
  }

  return { focusBlocks, interruptionCount };
};

const buildEventBreakdown = (events) => {
  const breakdown = { keystroke: 0, save: 0, commit: 0, error: 0, debug: 0 };
  events.forEach((event) => {
    if (breakdown.hasOwnProperty(event.type)) breakdown[event.type]++;
  });
  return breakdown;
};

const buildSession = async (sessionId, userId, projectId) => {
  const events = await getEventsBySession(sessionId);

  if (events.length === 0) {
    throw new Error(`No events found for sessionId: ${sessionId}`);
  }

  const startTime = new Date(events[0].timestamp);
  const endTime = new Date(events[events.length - 1].timestamp);
  const durationMinutes = Math.round((endTime - startTime) / 60000);

  const { focusBlocks, interruptionCount } = analyzeFocusPatterns(events);
  const eventBreakdown = buildEventBreakdown(events);

  const session = await Session.findOneAndUpdate(
    { sessionId },
    {
      userId,
      sessionId,
      projectId,
      startTime,
      endTime,
      durationMinutes,
      focusBlocks,
      interruptionCount,
      eventBreakdown,
      totalEvents: events.length,
      scored: false,
    },
    { upsert: true, new: true },
  );

  // Invalidate sessions cache — new session data written
  await invalidateCache(`sessions:${userId}:*`);

  return session;
};

const getSessionsByUserAndRange = async (userId, from, to) => {
  const cacheKey = `sessions:${userId}:${from.toISOString()}:${to.toISOString()}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`[cache] ✅ HIT — ${cacheKey}`);
    return cached;
  }

  const sessions = await Session.find({
    userId,
    startTime: { $gte: from, $lte: to },
  }).sort({ startTime: -1 });

  await setCache(cacheKey, sessions, TTL.SESSIONS);
  console.log(`[cache] 💾 SET — ${cacheKey}`);

  return sessions;
};

const getSessionById = async (sessionId) => {
  const session = await Session.findOne({ sessionId });
  return session;
};

export {
  buildSession,
  getSessionsByUserAndRange,
  getSessionById,
  analyzeFocusPatterns,
};
