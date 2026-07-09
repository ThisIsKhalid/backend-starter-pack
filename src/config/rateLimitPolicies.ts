import { RateLimitPolicy, emailKey, emailOrIpKey, ipKey } from "../app/middlewares/rateLimiter";

// ---------------------------------------------------------------------------
// Shared time window — all policies use a 15-minute sliding window.
// ---------------------------------------------------------------------------
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// ---------------------------------------------------------------------------
// Policies
// ---------------------------------------------------------------------------

/**
 * Login — 5 attempts per 15 min per (email | IP).
 * Blocks credential-stuffing while still allowing different IPs
 * for the same account (e.g. mobile + desktop).
 */
export const loginPolicy: RateLimitPolicy = {
  windowMs: WINDOW_MS,
  max: 5,
  keyPrefix: "login",
  keyGenerator: emailOrIpKey,
  message: "Too many login attempts. Please try again in 15 minutes.",
};

/**
 * Registration — 3 per 15 min per IP.
 * Prevents mass account creation from a single origin.
 */
export const registerPolicy: RateLimitPolicy = {
  windowMs: WINDOW_MS,
  max: 3,
  keyPrefix: "register",
  keyGenerator: ipKey,
  message: "Too many registration attempts. Please try again in 15 minutes.",
};

/**
 * OTP issue (verify-email / resend-otp / forgot-password) — 5 per 15 min per email.
 * Prevents OTP flooding to a target inbox.
 */
export const otpIssuePolicy: RateLimitPolicy = {
  windowMs: WINDOW_MS,
  max: 5,
  keyPrefix: "otp:issue",
  keyGenerator: emailKey,
  message: "Too many OTP requests. Please try again in 15 minutes.",
};

/**
 * OTP verification — 5 per 15 min per email.
 * Limits brute-force attempts against the 6-digit code.
 */
export const otpVerifyPolicy: RateLimitPolicy = {
  windowMs: WINDOW_MS,
  max: 5,
  keyPrefix: "otp:verify",
  keyGenerator: emailKey,
  message: "Too many OTP verification attempts. Please try again later.",
};

/**
 * Password reset — 3 per 15 min per email.
 * Stricter than OTP because it directly grants credential change.
 */
export const passwordResetPolicy: RateLimitPolicy = {
  windowMs: WINDOW_MS,
  max: 3,
  keyPrefix: "pwd:reset",
  keyGenerator: emailKey,
  message: "Too many password reset requests. Please try again in 15 minutes.",
};

/**
 * Refresh tokens — 30 per 15 min per IP.
 * Higher limit because legitimate apps refresh frequently,
 * but still prevents token-refresh abuse.
 */
export const refreshTokenPolicy: RateLimitPolicy = {
  windowMs: WINDOW_MS,
  max: 30,
  keyPrefix: "refresh",
  keyGenerator: ipKey,
  message: "Too many token refresh requests. Please try again later.",
};

/**
 * General authenticated traffic — 200 per 15 min per IP.
 * Covers /me, /change-password, /logout, and any future endpoints.
 */
export const authenticatedPolicy: RateLimitPolicy = {
  windowMs: WINDOW_MS,
  max: 200,
  keyPrefix: "auth:general",
  keyGenerator: ipKey,
  message: "Too many requests. Please try again later.",
};

/**
 * General anonymous traffic — 100 per 15 min per IP.
 * Applied to /api as a baseline; individual auth routes
 * stack their own stricter limits on top.
 */
export const anonymousPolicy: RateLimitPolicy = {
  windowMs: WINDOW_MS,
  max: 100,
  keyPrefix: "anon",
  keyGenerator: ipKey,
  message: "Too many requests. Please try again later.",
};
