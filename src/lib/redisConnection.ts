import Redis, { RedisOptions } from "ioredis";
import logger from "../utils/logger/logger";

const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    if (times > 10) {
      logger.error("Redis: max reconnection attempts reached");
      return null;
    }
    return Math.min(times * 200, 3000);
  },
  connectTimeout: 10000,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
};

export const redis = new Redis(redisOptions);

redis.on("connect", () => {
  logger.info("✅ Redis connected");
});

redis.on("ready", () => {
  logger.info("✅ Redis ready");
});

redis.on("error", (err: Error) => {
  logger.error(`❌ Redis error: ${err.message}`);
});

redis.on("close", () => {
  logger.warn("⚠️  Redis connection closed");
});

redis.on("reconnecting", () => {
  logger.warn("♻️  Redis reconnecting...");
});

// ---------------------------------------------------------------------------
// Token blacklist helpers (used for logout / access token invalidation)
// ---------------------------------------------------------------------------

const BLACKLIST_PREFIX = "blacklist:";

export const blacklistToken = async (token: string, ttlSeconds: number): Promise<void> => {
  await redis.set(`${BLACKLIST_PREFIX}${token}`, "1", "EX", ttlSeconds);
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const result = await redis.get(`${BLACKLIST_PREFIX}${token}`);
  return result !== null;
};

export default redis;
