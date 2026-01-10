import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import router from "./app/routes";

// Initialize app
const app: Application = express();

// Cors Options
const corsOptions = {
  origin: "",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: [
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

// Routes
app.use("/api/v1", router)

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
