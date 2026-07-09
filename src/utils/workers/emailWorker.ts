import nodemailer from "nodemailer";
import config from "../../config";
import prisma from "../../lib/prisma";
import logger from "../logger/logger";

// ---------------------------------------------------------------------------
// Singleton transporter — created once, reused for every message
// ---------------------------------------------------------------------------

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.emailSender.email,
    pass: config.emailSender.app_pass,
  },
  pool: true, // reuse connections
  maxConnections: 5,
  maxMessages: 100,
});

// ---------------------------------------------------------------------------
// Worker constants
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 5_000; // how often to check for new jobs
const BATCH_SIZE = 10; // jobs per poll cycle

// ---------------------------------------------------------------------------
// Process a single batch of pending jobs
// ---------------------------------------------------------------------------

const processBatch = async (): Promise<void> => {
  // Atomically claim jobs: move PENDING → PROCESSING
  // Using findMany + updateMany because MongoDB doesn't support SELECT FOR UPDATE.
  const pending = await prisma.emailJob.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  if (pending.length === 0) return;

  const ids = pending.map((j) => j.id);

  // Mark all as PROCESSING in one shot
  await prisma.emailJob.updateMany({
    where: { id: { in: ids } },
    data: { status: "PROCESSING" },
  });

  // Attempt delivery for each job
  for (const job of pending) {
    try {
      await transporter.sendMail({
        from: `"${config.app.name}" <${config.emailSender.email}>`,
        to: job.to,
        subject: job.subject,
        html: job.html,
      });

      await prisma.emailJob.update({
        where: { id: job.id },
        data: { status: "SENT" },
      });

      logger.info({ message: `Email sent`, to: job.to, subject: job.subject });
    } catch (err) {
      const nextAttempts = job.attempts + 1;
      const failed = nextAttempts >= job.maxAttempts;

      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: failed ? "FAILED" : "PENDING", // re-queue for retry
          attempts: nextAttempts,
          lastError: err instanceof Error ? err.message : String(err),
        },
      });

      logger.error({
        message: `Email delivery failed (${nextAttempts}/${job.maxAttempts})`,
        jobId: job.id,
        to: job.to,
        error: err instanceof Error ? err.message : err,
      });
    }
  }
};

// ---------------------------------------------------------------------------
// Worker loop
// ---------------------------------------------------------------------------

let running = false;
let timer: ReturnType<typeof setTimeout> | null = null;

const tick = async (): Promise<void> => {
  if (!running) return;
  try {
    await processBatch();
  } catch (err) {
    logger.error({
      message: "Email worker tick failed",
      error: err instanceof Error ? err.message : err,
    });
  } finally {
    if (running) {
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    }
  }
};

/** Start the background email worker. Safe to call multiple times. */
export const startEmailWorker = (): void => {
  if (running) return;
  running = true;
  logger.info("✉️  Email worker started");
  tick();
};

/** Gracefully stop the worker. */
export const stopEmailWorker = (): void => {
  running = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  logger.info("✉️  Email worker stopped");
};
