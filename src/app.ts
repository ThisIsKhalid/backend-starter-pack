import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import path from "path";
import GlobalErrorHandler from "./app/middlewares/globalErrorHandler";
// import { PaymentController } from "./app/modules/Payment/payment.controller";
import router from "./app/routes";
import logger from "./utils/logger";

const app: Application = express();

export const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://10.0.10.43:3000",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
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
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});

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
