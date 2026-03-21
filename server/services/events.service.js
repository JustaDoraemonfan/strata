// server/services/events.service.js
import Event from "../models/Event.model.js";
import { getCache, setCache, invalidateCache, TTL } from "../utils/cache.js";

const createEvent = async (eventData) => {
  const event = new Event(eventData);
  const saved = await event.save();

  // Invalidate events cache for this user — new event means cached ranges are stale
  await invalidateCache(`events:${eventData.userId}:*`);

  return saved;
};

const getEventsByUserAndRange = async (userId, from, to) => {
  const cacheKey = `events:${userId}:${from.toISOString()}:${to.toISOString()}`;

  // Check cache first
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`[cache] ✅ HIT — ${cacheKey}`);
    return cached;
  }

  // Cache miss — query Atlas
  const events = await Event.find({
    userId,
    timestamp: { $gte: from, $lte: to },
  }).sort({ timestamp: 1 });

  // Cache the result
  await setCache(cacheKey, events, TTL.EVENTS);
  console.log(`[cache] 💾 SET — ${cacheKey}`);

  return events;
};

const getEventsBySession = async (sessionId) => {
  // Not cached — called once per session build, not repeatedly
  const events = await Event.find({ sessionId }).sort({ timestamp: 1 });
  return events;
};

export { createEvent, getEventsByUserAndRange, getEventsBySession };
