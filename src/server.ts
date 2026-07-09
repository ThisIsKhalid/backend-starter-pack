import { Server } from "http";
import app from "./app";
import config from "./config";
import { startEmailWorker, stopEmailWorker } from "./helpers/email_sender/emailWorker";
import prisma from "./lib/prisma";
import redis from "./lib/redisConnection";
import logger from "./utils/logger/logger";

let server: Server;

async function main() {
  try {
    // 1. Connect to database
    await prisma.$connect();
    logger.info("🛢️  Database connected successfully");

    // 2. Connect to Redis
    await redis.connect();

    // 3. Start email delivery worker
    startEmailWorker();

    // 4. Start HTTP server
    server = app.listen(config.port, config.host, () => {
      logger.info(`🚀 Server running on ${config.host}:${config.port} [${config.env}]`);
      logger.info(`📄 API docs: http://localhost:${config.port}/api/docs`);
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        logger.error(`❌ Port ${config.port} is already in use`);
      } else {
        logger.error(`❌ Server error: ${error.message}`);
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

main();

// ---------------------------------------------------------------------------
// Graceful Shutdown
// ---------------------------------------------------------------------------

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info("HTTP server closed.");

      stopEmailWorker();
      logger.info("Email worker stopped.");

      try {
        await prisma.$disconnect();
        logger.info("Database disconnected.");
      } catch (err) {
        logger.error("Error disconnecting database:", err);
      }

      try {
        await redis.quit();
        logger.info("Redis disconnected.");
      } catch (err) {
        logger.error("Error disconnecting Redis:", err);
      }

      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error("Graceful shutdown timeout. Force exiting.");
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

const unexpectedErrorHandler = (error: unknown) => {
  logger.error("Unexpected error:", error);
  gracefulShutdown("UNEXPECTED_ERROR");
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
