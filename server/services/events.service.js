import Event from "../models/Event.model.js";

/**
 * Creates and persists a single developer event.
 * @param {Object} eventData - Validated event payload from the controller
 * @param {string} eventData.userId
 * @param {string} eventData.type - One of: keystroke | save | commit | error | debug
 * @param {Date}   eventData.timestamp
 * @param {string} eventData.sessionId
 * @param {string} eventData.projectId
 * @param {Object} eventData.metadata - Optional, shape varies per event type
 * @returns {Promise<Object>} The saved event document
 */

const createEvent = async (eventData) => {
  const event = new Event(eventData);
  const saved = await event.save();
  return saved;
};

/**
 * Retrieves all events for a user within a time range.
 * Used by the session service to build sessions from raw events.
 * @param {string} userId
 * @param {Date} from - Start of time range
 * @param {Date} to - End of time range
 * @returns {Promise<Array>} Array of event documents, sorted oldest → newest
 */

const getEventsByUserAndRange = async (userId, from, to) => {
  const events = await Event.find({
    userId,
    timestamp: { $gte: from, $lte: to },
  }).sort({ timestamp: 1 }); // Oldest first — important for session building logic

  return events;
};

/**
 * Retrieves all events belonging to a specific session.
 * Used by the scoring service when computing the Stratum Score.
 * @param {string} sessionId
 * @returns {Promise<Array>} Array of event documents, sorted oldest → newest
 */
const getEventsBySession = async (sessionId) => {
  const events = await Event.find({ sessionId }).sort({ timestamp: 1 });
  return events;
};

export { createEvent, getEventsByUserAndRange, getEventsBySession };
