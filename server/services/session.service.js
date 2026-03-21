import Session from "../models/Session.model.js";
import { getEventsBySession } from "./events.service.js";

// If gap between two consecutive events exceeds this → interruption detected
const INTERRUPTION_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Detects focus blocks and interruptions from a sorted array of events.
 * A focus block = uninterrupted coding for any duration.
 * An interruption = gap > 5 minutes between consecutive events.
 *
 * @param {Array} events - Sorted oldest → newest
 * @returns {{ focusBlocks: Array, interruptionCount: Number }}
 */
const analyzeFocusPatterns = (events) => {
  const focusBlocks = [];
  let interruptionCount = 0;

  if (events.length < 2) {
    return { focusBlocks, interruptionCount };
  }

  let blockStart = new Date(events[0].timestamp);
  let blockEnd = new Date(events[0].timestamp);

  for (let i = 1; i < events.length; i++) {
    const current = new Date(events[i].timestamp);
    const previous = new Date(events[i - 1].timestamp);
    const gap = current - previous;

    if (gap > INTERRUPTION_THRESHOLD_MS) {
      // Gap detected — close the current focus block
      const durationMinutes = Math.round((blockEnd - blockStart) / 60000);

      if (durationMinutes > 0) {
        focusBlocks.push({
          start: blockStart,
          end: blockEnd,
          durationMinutes,
        });
      }

      interruptionCount++;
      blockStart = current; // Start a new focus block
    }

    blockEnd = current; // Keep extending the current block
  }

  // Close the final block
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

/**
 * Counts how many of each event type exist in the session.
 * @param {Array} events
 * @returns {Object} breakdown - { keystroke, save, commit, error, debug }
 */
const buildEventBreakdown = (events) => {
  const breakdown = {
    keystroke: 0,
    save: 0,
    commit: 0,
    error: 0,
    debug: 0,
  };

  events.forEach((event) => {
    if (breakdown.hasOwnProperty(event.type)) {
      breakdown[event.type]++;
    }
  });

  return breakdown;
};

/**
 * Builds and persists a session document from raw events.
 * If a session document already exists for this sessionId, it gets updated.
 *
 * @param {string} sessionId
 * @param {string} userId
 * @param {string} projectId
 * @returns {Promise<Object>} The saved or updated session document
 */
const buildSession = async (sessionId, userId, projectId) => {
  // Fetch all events for this session — sorted oldest → newest by events.service.js
  const events = await getEventsBySession(sessionId);

  if (events.length === 0) {
    throw new Error(`No events found for sessionId: ${sessionId}`);
  }

  const startTime = new Date(events[0].timestamp);
  const endTime = new Date(events[events.length - 1].timestamp);
  const durationMinutes = Math.round((endTime - startTime) / 60000);

  const { focusBlocks, interruptionCount } = analyzeFocusPatterns(events);
  const eventBreakdown = buildEventBreakdown(events);

  // upsert: true → creates if doesn't exist, updates if it does
  // This means buildSession is safely re-runnable without creating duplicates
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
      scored: false, // Reset scored flag — needs re-scoring after rebuild
    },
    { upsert: true, new: true }, // new: true → returns updated document
  );

  return session;
};

/**
 * Retrieves all sessions for a user within a time range.
 * Called by the insights service and the dashboard.
 *
 * @param {string} userId
 * @param {Date} from
 * @param {Date} to
 * @returns {Promise<Array>} Array of session documents, newest first
 */
const getSessionsByUserAndRange = async (userId, from, to) => {
  const sessions = await Session.find({
    userId,
    startTime: { $gte: from, $lte: to },
  }).sort({ startTime: -1 }); // Newest first — dashboard shows recent sessions first

  return sessions;
};

/**
 * Retrieves a single session by sessionId.
 * @param {string} sessionId
 * @returns {Promise<Object|null>}
 */
const getSessionById = async (sessionId) => {
  const session = await Session.findOne({ sessionId });
  return session;
};

export {
  buildSession,
  getSessionsByUserAndRange,
  getSessionById,
  analyzeFocusPatterns, // Exported for use in scoring.service.js
};
