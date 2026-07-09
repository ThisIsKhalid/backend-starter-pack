import { NextFunction, Request, Response } from "express";
import { redis } from "../../lib/redisConnection";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateLimitPolicy {
  /** Sliding window size in milliseconds. */
  windowMs: number;
  /** Maximum requests allowed per window. */
  max: number;
  /** Redis key prefix — keeps each policy's counters isolated. */
  keyPrefix: string;
  /**
   * Derive the rate-limit key from the request.
   * Default: `req.ip` (respects `trust proxy`).
   * Return `null` to skip limiting for this request.
   */
  keyGenerator?: (req: Request) => string | null;
  /** Error message returned when the limit is exceeded. */
  message?: string;
}

interface RateLimitHeaders {
  "RateLimit-Limit": number;
  "RateLimit-Remaining": number;
  "RateLimit-Reset": number;
}

// ---------------------------------------------------------------------------
// Core middleware factory
// ---------------------------------------------------------------------------

/**
 * Create an Express middleware that enforces a Redis-backed sliding-window
 * rate limit.
 *
 * Uses INCR + EXPIRE — atomic, fast (~0.1 ms per request via ioredis),
 * and shared across every instance of the application.
 */
export const rateLimiter = (policy: RateLimitPolicy) => {
  const {
    windowMs,
    max,
    keyPrefix,
    keyGenerator = (req) => req.ip,
    message = "Too many requests, please try again later.",
  } = policy;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identity = keyGenerator(req);

    // If keyGenerator returns null, skip rate limiting (e.g. internal calls).
    if (identity === null) {
      return next();
    }

    const key = `ratelimit:${keyPrefix}:${identity}`;
    const windowSeconds = Math.ceil(windowMs / 1000);

    try {
      // INCR is atomic — safe under concurrent requests.
      const count = await redis.incr(key);

      // Set TTL only on the first request in the window (avoids resetting).
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      // Fetch remaining TTL for the Reset header.
      const ttl = await redis.ttl(key);
      const reset = Math.floor(Date.now() / 1000) + (ttl > 0 ? ttl : windowSeconds);

      // Set standard rate-limit headers (RFC 6585 / draft-ietf-httpapi-ratelimit-headers).
      const headers: RateLimitHeaders = {
        "RateLimit-Limit": max,
        "RateLimit-Remaining": Math.max(0, max - count),
        "RateLimit-Reset": reset,
      };
      for (const [h, v] of Object.entries(headers)) {
        res.setHeader(h, v);
      }

      if (count > max) {
        res.setHeader("Retry-After", String(ttl > 0 ? ttl : windowSeconds));
        res.status(429).json({
          success: false,
          message,
        });
        return;
      }

      next();
    } catch (err) {
      // If Redis is down, fail open — don't block legitimate traffic.
      // Log the error but let the request through.
      console.error(`Rate limiter Redis error (${keyPrefix}):`, err);
      next();
    }
  };
};

// ---------------------------------------------------------------------------
// Helper: key generators
// ---------------------------------------------------------------------------

/** Extract the caller's IP (respects trust proxy). */
export const ipKey = (req: Request): string => req.ip ?? "unknown";

/**
 * Extract an email from the request body.
 * Returns `null` if no `email` field is present — the middleware
 * will skip limiting for that request.
 */
export const emailKey = (req: Request): string | null => {
  const email = req.body?.email;
  return typeof email === "string" && email.length > 0 ? email.toLowerCase() : null;
};

/**
 * Composite key: email (if available) falls back to IP.
 * Best for login/register where we want per-account limits
 * but still protect anonymous callers.
 */
export const emailOrIpKey = (req: Request): string => {
  const email = req.body?.email;
  if (typeof email === "string" && email.length > 0) {
    return `email:${email.toLowerCase()}`;
  }
  return `ip:${req.ip ?? "unknown"}`;
};
