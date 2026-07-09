import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Load .env before validation so process.env is populated
// ---------------------------------------------------------------------------
dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const envSchema = z
  .object({
    // ---- Core ----
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(8000),
    HOST: z.string().min(1).default("0.0.0.0"),

    // ---- App ----
    APP_NAME: z.string().default("Backend Starter Pack"),
    APP_VERSION: z.string().default("1.0.0"),
    FRONTEND_URL: z.string().url().default("http://localhost:3000"),
    BACKEND_URL: z.string().url().default("http://localhost:8000"),
    DATABASE_URL: z.string().url().min(1, "DATABASE_URL is required"),

    PASSWORD_SALT: z.coerce.number().int().min(4).max(20).default(12),

    // ---- JWT ----
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
    JWT_RESET_SECRET: z.string().min(32, "JWT_RESET_SECRET must be at least 32 characters"),
    JWT_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

    // ---- Redis ----
    REDIS_HOST: z.string().min(1).default("127.0.0.1"),
    REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
    REDIS_PASSWORD: z.string().optional(),

    // ---- Email ----
    EMAIL_SENDER_EMAIL: z.string().email("EMAIL_SENDER_EMAIL must be a valid email"),
    EMAIL_SENDER_APP_PASS: z.string().min(1, "EMAIL_SENDER_APP_PASS is required"),

    // ---- CORS ----
    CORS_ORIGIN: z.string().default("*"),
  })
  .refine((data) => data.JWT_SECRET !== data.JWT_REFRESH_SECRET, {
    message: "JWT_SECRET and JWT_REFRESH_SECRET must be different",
    path: ["JWT_REFRESH_SECRET"],
  })
  .refine((data) => data.JWT_SECRET !== data.JWT_RESET_SECRET, {
    message: "JWT_SECRET and JWT_RESET_SECRET must be different",
    path: ["JWT_RESET_SECRET"],
  })
  .refine((data) => data.JWT_REFRESH_SECRET !== data.JWT_RESET_SECRET, {
    message: "JWT_REFRESH_SECRET and JWT_RESET_SECRET must be different",
    path: ["JWT_RESET_SECRET"],
  })
  .refine((data) => !(data.NODE_ENV === "production" && data.CORS_ORIGIN === "*"), {
    message: "CORS_ORIGIN cannot be '*' in production — set an explicit origin",
    path: ["CORS_ORIGIN"],
  });

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------

export type Env = z.infer<typeof envSchema>;

let parsed: Env;

try {
  parsed = envSchema.parse(process.env);
} catch (err) {
  if (err instanceof z.ZodError) {
    const formatted = err.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
    console.error(`❌ Configuration errors:\n${formatted}`);
    process.exit(1);
  }
  throw err;
}

// ---------------------------------------------------------------------------
// Typed config object (consumed by the rest of the app)
// ---------------------------------------------------------------------------

const config = {
  env: parsed.NODE_ENV,
  port: parsed.PORT,
  host: parsed.HOST,
  app: {
    name: parsed.APP_NAME,
    version: parsed.APP_VERSION,
    frontendUrl: parsed.FRONTEND_URL,
    backendUrl: parsed.BACKEND_URL,
    databaseUrl: parsed.DATABASE_URL,
  },
  password_salt: parsed.PASSWORD_SALT,
  jwt: {
    secret: parsed.JWT_SECRET,
    refreshSecret: parsed.JWT_REFRESH_SECRET,
    resetSecret: parsed.JWT_RESET_SECRET,
    expiresIn: parsed.JWT_EXPIRES_IN,
    refreshExpiresIn: parsed.JWT_REFRESH_EXPIRES_IN,
    resetExpiresIn: "10m" as const,
  },
  redis: {
    host: parsed.REDIS_HOST,
    port: parsed.REDIS_PORT,
    password: parsed.REDIS_PASSWORD,
  },
  emailSender: {
    email: parsed.EMAIL_SENDER_EMAIL,
    app_pass: parsed.EMAIL_SENDER_APP_PASS,
  },
  cors: {
    origin: parsed.CORS_ORIGIN,
  },
} as const;

export default config;
