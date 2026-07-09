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

// ---------------------------------------------------------------------------
// OTP rate-limiting helpers
// ---------------------------------------------------------------------------

const OTP_ATTEMPT_PREFIX = "otp:attempts:";
const OTP_COOLDOWN_PREFIX = "otp:cooldown:";
const OTP_IP_PREFIX = "otp:ip:";

const OTP_MAX_ATTEMPTS = 5; // per-account attempts before cooldown
const OTP_COOLDOWN_SECONDS = 15 * 60; // 15-minute cooldown after lockout
const OTP_IP_MAX = 20; // per-IP attempts across all accounts
const OTP_WINDOW_SECONDS = 15 * 60; // sliding window for IP counter

/** Increment per-account OTP attempts. Returns current count. */
export const incrementOtpAttempts = async (userId: string, purpose: string): Promise<number> => {
  const key = `${OTP_ATTEMPT_PREFIX}${userId}:${purpose}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, OTP_WINDOW_SECONDS);
  }
  return count;
};

/** Increment per-IP OTP attempts. Returns current count. */
export const incrementOtpIpAttempts = async (ip: string): Promise<number> => {
  const key = `${OTP_IP_PREFIX}${ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, OTP_WINDOW_SECONDS);
  }
  return count;
};

/** Block an account after exceeding max attempts. */
export const setOtpCooldown = async (userId: string, purpose: string): Promise<void> => {
  const key = `${OTP_COOLDOWN_PREFIX}${userId}:${purpose}`;
  await redis.set(key, "1", "EX", OTP_COOLDOWN_SECONDS);
};

/** Check if an account is currently in cooldown. */
export const isOtpOnCooldown = async (userId: string, purpose: string): Promise<boolean> => {
  const key = `${OTP_COOLDOWN_PREFIX}${userId}:${purpose}`;
  const result = await redis.get(key);
  return result !== null;
};

/** Reset attempt counters (called on successful OTP verification). */
export const resetOtpAttempts = async (userId: string, purpose: string): Promise<void> => {
  const key = `${OTP_ATTEMPT_PREFIX}${userId}:${purpose}`;
  await redis.del(key);
};

export { OTP_IP_MAX, OTP_MAX_ATTEMPTS };

export default redis;
