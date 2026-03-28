import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import responseTime from "response-time";
import GlobalErrorHandler from "./app/middlewares/globalErrorHandler";
import router from "./app/routes";
import config from "./config";
import prisma from "./lib/prisma";
import { setupSwagger } from "./lib/swagger";
import logger from "./utils/logger/logger";

// Initialize app
const app: Application = express();

// ---------------------------------------------------------------------------
// Security Middlewares
// ---------------------------------------------------------------------------

app.use(helmet());

// Trust proxy (needed when behind nginx/load balancer)
app.set("trust proxy", 1);

// CORS
const corsOptions = {
  origin: config.env === "production" ? config.cors.origin.split(",") : "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "x-client-type", "Accept", "Origin"],
  credentials: true,
  exposedHeaders: ["Content-Range", "Content-Length", "Accept-Ranges"],
};
app.use(cors(corsOptions));

// HTTP Parameter Pollution prevention
app.use(hpp());

// ---------------------------------------------------------------------------
// Body Parsers
// ---------------------------------------------------------------------------

type RawBodyRequest = Request & { rawBody?: Buffer };

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      (req as RawBodyRequest).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("public"));

// ---------------------------------------------------------------------------
// Rate Limiting
// ---------------------------------------------------------------------------

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

// Strict limiter for auth endpoints (login, register, forgot-password)
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
});

app.use("/api", generalLimiter);
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);
app.use("/api/v1/auth/forgot-password", authLimiter);
app.use("/api/v1/auth/resend-otp", authLimiter);

// ---------------------------------------------------------------------------
// Request Logging
// ---------------------------------------------------------------------------

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

    if (!req.path.includes("/stream/")) {
      logger.info({
        message: `${req.method} ${req.originalUrl} ${res.statusCode} - ${timeInMs}ms [${timeCategory}]`,
        method: req.method,
        url: req.originalUrl,
        responseTime: `${timeInMs}ms`,
        timeCategory,
        statusCode: res.statusCode,
      });
    }

    if (time > 1000) {
      logger.warn({
        message: `Slow response: ${req.method} ${req.originalUrl}`,
        responseTime: `${timeInMs}ms`,
        statusCode: res.statusCode,
        alert: "SLOW_RESPONSE",
      });
    }
  })
);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Root
app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: `${config.app.name} v${config.app.version} is running`,
  });
});

// Health check
app.get("/api/v1/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    res.status(200).json({
      success: true,
      message: "Server is healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      },
      database: "connected",
    });
  } catch {
    res.status(503).json({
      success: false,
      message: "Service unavailable",
      database: "disconnected",
    });
  }
});

// API routes
app.use("/api/v1", router);

// Swagger documentation (non-production only)
setupSwagger(app);

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

// 404 handler
app.use((_req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
    error: {
      path: _req.originalUrl,
      message: "The requested path does not exist.",
    },
  });
});

// Global error handler
app.use(GlobalErrorHandler);

export default app;
