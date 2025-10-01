import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import path from "path";
import GlobalErrorHandler from "./app/middlewares/globalErrorHandler";
// import { PaymentController } from "./app/modules/Payment/payment.controller";
import responseTime from "response-time";
import router from "./app/routes";
import logger from "./utils/logger/logger";

const app: Application = express();

export const corsOptions = {
  origin: [
    "https://api.myfinancialtrading.com",
    "https://myfinancialtrading.com",
    "https://dev.myfinancialtrading.com",
    "https://api.dev.myfinancialtrading.com",
    "http://localhost:5001",
    "http://localhost:3001",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-client-type",
    "Accept",
    "Origin",
    "X-Requested-With",
  ],
  credentials: true,
};

// app.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   PaymentController.stripeWebhook
// );

// Middleware setup
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Route handler for the root endpoint
app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "Welcome to the API",
  });
});

// app.use("/uploads", express.static(path.join("/var/www/uploads")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"))); // Serve static files from the "uploads" directory

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

    logger.info({
      message: `Request processed - ${timeCategory}: ${timeInMs}ms - ${req.method} ${req.originalUrl}`,
      method: req.method,
      url: req.originalUrl,
      responseTime: `${timeInMs}ms`,
      timeCategory,
      statusCode: res.statusCode,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
    });

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

// Setup API routes
app.use("/api/v1", router);

// health check
app.get("/api/v1/health", (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: "Server is healthy, So far so good!",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
    apiVersion: "v1",
    serverTime: new Date().toISOString(),
    host: req.hostname,
    port: process.env.PORT || 5000,
    requestHeaders: req.headers,
    responseHeaders: res.getHeaders(),
  });
});

// Error handling middleware
app.use(GlobalErrorHandler);

// 404 Not Found handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND!",
    error: {
      path: req.originalUrl,
      message: "Your requested path is not found!",
    },
  });
});

export default app;
