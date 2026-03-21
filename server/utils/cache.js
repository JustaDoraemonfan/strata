import redis from "../config/redis.js";

/**
 * Get a cached value by key.
 * Returns parsed object or null if not found.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
const getCache = async (key) => {
  try {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    // Never let cache failures break the app — log and continue
    console.error(`[cache] ❌ GET failed for key ${key}: ${error.message}`);
    return null;
  }
};

/**
 * Set a cache value with TTL.
 * @param {string} key
 * @param {any} value - Will be JSON stringified
 * @param {number} ttlSeconds - Expiry in seconds
 * @returns {Promise<void>}
 */
const setCache = async (key, value, ttlSeconds) => {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error(`[cache] ❌ SET failed for key ${key}: ${error.message}`);
  }
};

/**
 * Delete all keys matching a pattern.
 * Used for cache invalidation when data changes.
 * @param {string} pattern - e.g. 'sessions:user_001:*'
 * @returns {Promise<void>}
 */
const invalidateCache = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(
        `[cache] 🗑️  Invalidated ${keys.length} key(s) matching: ${pattern}`,
      );
    }
  } catch (error) {
    console.error(
      `[cache] ❌ Invalidation failed for pattern ${pattern}: ${error.message}`,
    );
  }
};

// TTL constants — single source of truth for all cache durations
export const TTL = {
  EVENTS: 2 * 60, // 2 minutes
  SESSIONS: 5 * 60, // 5 minutes
  INSIGHTS: 60 * 60, // 1 hour
};

export { getCache, setCache, invalidateCache };
