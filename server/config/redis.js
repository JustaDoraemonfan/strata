import Redis from "ioredis";
import { REDIS_URL } from "./env.js";

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3, // Fail fast — don't hang forever on Redis issues
  enableReadyCheck: true, // Verify connection is ready before use
  retryStrategy: (times) => {
    if (times > 3) {
      console.error("[redis] ❌ Max retries reached — giving up");
      return null; // Stop retrying
    }
    const delay = Math.min(times * 200, 1000); // 200ms, 400ms, 600ms backoff
    console.warn(`[redis] 🔄 Retrying connection (attempt ${times})...`);
    return delay;
  },
});

// Log all connection state changes
redis.on("connect", () => console.log("[redis] ✅ Redis connected"));

redis.on("ready", () =>
  console.log("[redis] 🚀 Redis ready to accept commands"),
);

redis.on("error", (err) =>
  console.error(`[redis] ❌ Redis error: ${err.message}`),
);

redis.on("close", () => console.warn("[redis] ⚠️  Redis connection closed"));

redis.on("reconnecting", () =>
  console.warn("[redis] 🔄 Redis reconnecting..."),
);

export default redis;
