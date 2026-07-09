import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_RESET_SECRET",
] as const;

const missingVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(", ")}`);
  process.exit(1);
}

const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 8000,
  host: process.env.HOST || "0.0.0.0",
  app: {
    name: process.env.APP_NAME || "Backend Starter Pack",
    version: process.env.APP_VERSION || "1.0.0",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    backendUrl: process.env.BACKEND_URL || "http://localhost:8000",
  },
  password_salt: Number(process.env.PASSWORD_SALT) || 12,
  jwt: {
    secret: process.env.JWT_SECRET as string,
    refreshSecret: process.env.JWT_REFRESH_SECRET as string,
    resetSecret: process.env.JWT_RESET_SECRET as string,
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    resetExpiresIn: "10m",
  },
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  emailSender: {
    email: process.env.EMAIL_SENDER_EMAIL || "",
    app_pass: process.env.EMAIL_SENDER_APP_PASS || "",
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
  },
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    authMax: Number(process.env.RATE_LIMIT_AUTH_MAX) || 10,
  },
};

export default config;
