import prisma from "../lib/prisma";
import logger from "../utils/logger/logger";

// ---------------------------------------------------------------------------
// Cleanup intervals (ms)
// ---------------------------------------------------------------------------
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // every hour

// ---------------------------------------------------------------------------
// Prune expired OTP tokens
// ---------------------------------------------------------------------------
const pruneExpiredOtpTokens = async (): Promise<number> => {
  const { count } = await prisma.otpToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
};

// ---------------------------------------------------------------------------
// Prune expired & revoked refresh tokens (older than 7 days)
// ---------------------------------------------------------------------------
const pruneStaleRefreshTokens = async (): Promise<number> => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const { count } = await prisma.refreshToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { lt: cutoff } }],
    },
  });
  return count;
};

// ---------------------------------------------------------------------------
// Prune old completed / failed email jobs (older than 7 days)
// ---------------------------------------------------------------------------
const pruneOldEmailJobs = async (): Promise<number> => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const { count } = await prisma.emailJob.deleteMany({
    where: {
      status: { in: ["SENT", "FAILED"] },
      createdAt: { lt: cutoff },
    },
  });
  return count;
};

// ---------------------------------------------------------------------------
// Worker loop
// ---------------------------------------------------------------------------
let running = false;
let timer: ReturnType<typeof setTimeout> | null = null;

const tick = async (): Promise<void> => {
  if (!running) return;
  try {
    const [otpCount, rtCount, ejCount] = await Promise.all([
      pruneExpiredOtpTokens(),
      pruneStaleRefreshTokens(),
      pruneOldEmailJobs(),
    ]);

    if (otpCount + rtCount + ejCount > 0) {
      logger.info({
        message: "Cleanup: pruned stale records",
        otpTokens: otpCount,
        refreshTokens: rtCount,
        emailJobs: ejCount,
      });
    }
  } catch (err) {
    logger.error({
      message: "Cleanup worker tick failed",
      error: err instanceof Error ? err.message : err,
    });
  } finally {
    if (running) {
      timer = setTimeout(tick, CLEANUP_INTERVAL_MS);
    }
  }
};

/** Start the cleanup worker. Safe to call multiple times. */
export const startCleanupWorker = (): void => {
  if (running) return;
  running = true;
  logger.info("🧹 Cleanup worker started (hourly)");
  tick();
};

/** Stop the cleanup worker. */
export const stopCleanupWorker = (): void => {
  running = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  logger.info("🧹 Cleanup worker stopped");
};
