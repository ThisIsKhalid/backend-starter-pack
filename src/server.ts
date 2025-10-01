import { Server } from "http";
import app from "./app";
import config from "./config";
import prisma from "./lib/prisma";

let server: Server;
let isShuttingDown = false;

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`🔄 Received ${signal}, starting graceful shutdown...`);

  // Set a timeout for forced shutdown
  const forceShutdownTimeout = setTimeout(() => {
    console.error("❌ Forced shutdown due to timeout");
    process.exit(1);
  }, 30000); // 30 seconds timeout

  try {
    // 1. Stop accepting new connections
    if (server) {
      console.log("🔄 Closing HTTP server...");
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log("✅ HTTP server closed");
    }

    // 2. Close database connections
    console.log("🔄 Disconnecting from database...");
    await prisma.$disconnect();
    console.log("✅ Database disconnected");

    clearTimeout(forceShutdownTimeout);
    console.log("✅ Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during graceful shutdown:", error);
    clearTimeout(forceShutdownTimeout);
    process.exit(1);
  }
}

// Error handlers
async function handleUncaughtException(error: Error) {
  console.error("❌ Uncaught Exception:", error);
  await gracefulShutdown("UNCAUGHT_EXCEPTION");
}

async function handleUnhandledRejection(reason: any, promise: Promise<any>) {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  await gracefulShutdown("UNHANDLED_REJECTION");
}

function setupProcessHandlers() {
  // Graceful shutdown signals
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGHUP", () => gracefulShutdown("SIGHUP"));

  // Error handlers
  process.on("uncaughtException", handleUncaughtException);
  process.on("unhandledRejection", handleUnhandledRejection);

  // Prevent multiple handlers in development
  process.removeAllListeners("SIGINT");
  process.removeAllListeners("SIGTERM");
  process.removeAllListeners("uncaughtException");
  process.removeAllListeners("unhandledRejection");

  process.once("SIGINT", () => gracefulShutdown("SIGINT"));
  process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.once("uncaughtException", handleUncaughtException);
  process.once("unhandledRejection", handleUnhandledRejection);
}

// Main server startup function
async function startServer() {
  try {
    // 1. Connect to database first
    console.log("🔄 Connecting to database...");
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // 2. Test database connection
    await prisma.$runCommandRaw({ ping: 1 });
    console.log("✅ Database ping successful");

    // 3. Initialize super admin (if needed)
    // console.log("🔄 Initializing super admin...");
    // await initiateSuperAdmin();
    // console.log("✅ Super admin initialized");

    // 4. Start HTTP server
    console.log("🔄 Starting HTTP server...");
    server = app.listen(config.port, () => {
      console.log(`✅ Server is running on port ${config.port}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // Configure server settings
    server.keepAliveTimeout = 65000; // Slightly higher than ALB idle timeout
    server.headersTimeout = 66000; // Should be higher than keepAliveTimeout

    // Handle server errors
    server.on("error", (error: any) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${config.port} is already in use`);
      } else {
        console.error("❌ Server error:", error);
      }
      process.exit(1);
    });

    // Setup process event handlers
    setupProcessHandlers();
  } catch (error) {
    console.error("❌ Failed to start server:", error);

    // Retry in production
    if (process.env.NODE_ENV === "production") {
      console.log("🔄 Retrying server start in 5 seconds...");
      setTimeout(startServer, 5000);
    } else {
      process.exit(1);
    }
  }
}

// Start the application
startServer();
