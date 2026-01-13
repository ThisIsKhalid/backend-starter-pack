import fs from "fs";
import path from "path";
import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// Function to format the log output
const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.splat(),
  format.colorize(),
  format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}] ${message} ${stack || ""}`;
  })
);

const fileFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const infoTransport = new DailyRotateFile({
  filename: path.join(logDir, "info-%DATE%.log"),
  datePattern: "YYYY-MM-DD-HH-mm", // rotate every minute
  level: "info",
  zippedArchive: false,
  maxFiles: "15m", // keep last 15 logs (~15 min)
  utc: true,
});

const errorTransport = new DailyRotateFile({
  filename: path.join(logDir, "error-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  level: "error",
  maxFiles: "30d",
  zippedArchive: true,
  utc: true,
});

const logger = createLogger({
  level: "info",
  format: fileFormat,
  defaultMeta: { service: process.env.SERVICE_NAME || "default-service-name" },
  transports: [
    new transports.Console({
      format: logFormat,
    }),
    infoTransport,
    errorTransport,
  ],
  exitOnError: false,
});

export default logger;
