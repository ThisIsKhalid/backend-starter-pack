import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import responseTime from "response-time";
import router from "./app/routes";
import config from "./config";
import logger from "./utils/logger/logger";

// Initialize app
const app: Application = express();

// Cors Options
const corsOptions = {
  origin: config.env === "production" ? process.env.CORS_ORIGIN : "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  ALLOWED_HEADERS: [
    "Content-Type",
    "Authorization",
    "x-client-type",
    "Accept",
    "Origin",
  ],
  credentials: true,
  exposedHeaders: [
    "Content-Range",
    "Content-Length",
    "Accept-Ranges",
    "Connection",
    "Upgrade",
  ],
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Endpoints ( root )
app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "API Server is running..",
  });
});

// Log incoming requests
app.use(
  responseTime((req: Request, res: Response, time: number) => {
    const timeInMs = time.toFixed(2);
    const timeCategory =
      time < 100
        ? "VERY FAST"
        : time < 200
        ? "FAST"
        : time < 500
        ? "NORMAL"
        : time < 1000
        ? "SLOW"
        : time < 5000
        ? "VERY_SLOW"
        : "CRITICAL";

    // Skip logging for streaming requests to reduce noise
    if (!req.path.includes("/stream/")) {
      logger.info({
        message: `Request processed - ${timeCategory}: ${timeInMs}ms - ${req.method} ${req.originalUrl}`,
        method: req.method,
        url: req.originalUrl,
        responseTime: `${timeInMs}ms`,
        timeCategory,
        statusCode: res.statusCode,
        // userAgent: req.get("User-Agent"),
        // ip: req.ip,
      });
    }

    // Alert for performance issues
    if (time > 1000) {
      logger.warn({
        message: `Performance concern: ${req.method} ${req.originalUrl}`,
        responseTime: `${timeInMs}ms`,
        statusCode: res.statusCode,
        alert: "SLOW_RESPONSE",
      });
    }
  })
);

// Routes
app.use("/api/v1", router);

// Health check endpoint
app.get("/api/v1/health", async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      message: "Server is healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Server health check failed",
      error: "Database connection failed",
    });
  }
});

// 404 Not Found handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: "API NOT FOUND!",
    error: {
      path: req.originalUrl,
      message: "Your requested path is not found!",
    },
  });
});

export default app;
