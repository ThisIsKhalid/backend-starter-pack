# Backend Starter Pack

Production-focused backend starter built with **Express 5 + TypeScript + Prisma (MongoDB)**.
It includes authentication, OTP email flow, role-based access control, Redis token blacklist, Swagger docs, testing, Docker, and structured logging.

---

## Table of Contents

- [What You Get](#what-you-get)
- [Tech Stack](#tech-stack)
- [Architecture & Folder Layout](#architecture--folder-layout)
- [Quick Start (Local)](#quick-start-local)
- [Quick Start (Docker)](#quick-start-docker)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API & Swagger](#api--swagger)
- [Auth Module Guide](#auth-module-guide)
- [Request/Response Pattern](#requestresponse-pattern)
- [How to Add a New Module](#how-to-add-a-new-module)
- [Database & Prisma Notes](#database--prisma-notes)
- [Testing Guide](#testing-guide)
- [Logging Guide](#logging-guide)
- [Security Features](#security-features)
- [Troubleshooting (If You Get Stuck)](#troubleshooting-if-you-get-stuck)
- [Production Deployment Checklist](#production-deployment-checklist)

---

## What You Get

- ✅ **Production-ready middleware stack** (Helmet, CORS, HPP, request limits)
- ✅ **JWT auth + refresh token rotation**
- ✅ **Role-based authorization** (`USER`, `ADMIN`, `SUPER_ADMIN`)
- ✅ **OTP-based email verification & password reset**
- ✅ **Redis token blacklist** for logout/session invalidation
- ✅ **Prisma + MongoDB schema** with auth/session tables
- ✅ **Swagger/OpenAPI docs** (non-production)
- ✅ **Jest + Supertest setup** with auth and health tests
- ✅ **Winston logging** with rotating log files
- ✅ **Docker + docker-compose** for app, MongoDB, Redis

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Language:** TypeScript
- **ORM/Database:** Prisma + MongoDB
- **Cache/Session Utility:** Redis (`ioredis`)
- **Validation:** Zod
- **Security:** helmet, hpp, express-rate-limit, JWT
- **Docs:** swagger-jsdoc + swagger-ui-express
- **Testing:** Jest + Supertest + ts-jest
- **Logging:** Winston + daily rotate file
- **Containers:** Docker (multi-stage, hardened runtime) + docker-compose

---

## Architecture & Folder Layout

This project follows a **feature module architecture**.
Each module owns its route, validation, controller, and service layers.

```text
src/
├── app/
│   ├── middlewares/
│   │   ├── auth.ts
│   │   ├── globalErrorHandler.ts
│   │   ├── validateRequest.ts
│   │   └── validateImageContent.ts
│   ├── modules/
│   │   └── Auth/
│   │       ├── auth.interface.ts
│   │       ├── auth.validation.ts
│   │       ├── auth.service.ts
│   │       ├── auth.controller.ts
│   │       └── auth.route.ts
│   ├── routes/
│   │   └── index.ts
│   └── db/
│       └── seed.ts
├── config/
│   └── index.ts
├── lib/
│   ├── prisma.ts
│   ├── redisConnection.ts
│   └── swagger.ts
├── shared/
│   ├── catchAsync.ts
│   ├── sendResponse.ts
│   └── emails/
├── utils/
│   └── logger/
├── app.ts
└── server.ts
```

Request flow:

```text
Client -> Route -> Validation -> Controller -> Service -> Prisma/Redis/Email
                                                    -> sendResponse
```

---

## Quick Start (Local)

### 1) Prerequisites

- Node.js **20+** (22 recommended)
- MongoDB running locally or Atlas URL
- Redis running locally or remote
- npm
- (Optional) Gmail App Password for OTP email sending

### 2) Install dependencies

```bash
npm install
```

### 3) Configure environment

```bash
cp .env.example .env
```

Then update `.env` values (at minimum):

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

### 4) Generate Prisma client and sync schema

```bash
npm run prisma:generate
npx prisma db push
```

> This project uses MongoDB. Use `prisma db push` for schema sync.

### 5) (Optional) Seed default users

```bash
npm run prisma:seed
```

Default seeded accounts:

- `superadmin@example.com / SuperAdmin@123`
- `admin@example.com / Admin@123`
- `user@example.com / User@123`

### 6) Start in development mode

```bash
npm run dev
```

### 7) Verify everything is running

- Root: `GET http://localhost:8000/`
- Health: `GET http://localhost:8000/api/v1/health`
- Swagger (dev only): `http://localhost:8000/api/docs`

---

## Quick Start (Docker)

### 1) Prepare environment file

```bash
cp .env.example .env
```

Recommended updates in `.env` for Docker usage:

- `PORT=8000`
- valid JWT secrets
- optional email credentials

### 2) Build and run all services

```bash
docker compose up --build -d
```

This starts:

- `app` (backend API)
- `mongo` (MongoDB 7)
- `redis` (Redis 7)

### 3) Check status and logs

```bash
docker compose ps
docker compose logs -f app
```

### 4) Stop services

```bash
docker compose down
```

To remove volumes as well:

```bash
docker compose down -v
```

---

## Environment Variables

Copy from `.env.example` and update as needed.

| Variable                 | Required | Default                 | Purpose                                      |
| ------------------------ | -------- | ----------------------- | -------------------------------------------- |
| `NODE_ENV`               | No       | `development`           | App environment (`development`/`production`) |
| `PORT`                   | No       | `8000`                  | Server port                                  |
| `HOST`                   | No       | `0.0.0.0`               | Server bind host                             |
| `APP_NAME`               | No       | `Backend Starter Pack`  | Display name in root/Swagger                 |
| `APP_VERSION`            | No       | `1.0.0`                 | Version metadata                             |
| `FRONTEND_URL`           | No       | `http://localhost:3000` | Frontend reference URL                       |
| `BACKEND_URL`            | No       | `http://localhost:8000` | Backend reference URL                        |
| `DATABASE_URL`           | **Yes**  | —                       | MongoDB connection string                    |
| `JWT_SECRET`             | **Yes**  | —                       | Access token secret                          |
| `JWT_REFRESH_SECRET`     | **Yes**  | —                       | Refresh token secret                         |
| `JWT_EXPIRES_IN`         | No       | `15m`                   | Access token TTL                             |
| `JWT_REFRESH_EXPIRES_IN` | No       | `7d`                    | Refresh token TTL                            |
| `REDIS_HOST`             | No       | `127.0.0.1`             | Redis host                                   |
| `REDIS_PORT`             | No       | `6379`                  | Redis port                                   |
| `REDIS_PASSWORD`         | No       | empty                   | Redis password                               |
| `EMAIL_SENDER_EMAIL`     | No       | empty                   | Sender email                                 |
| `EMAIL_SENDER_APP_PASS`  | No       | empty                   | Gmail App Password                           |
| `PASSWORD_SALT`          | No       | `12`                    | Bcrypt salt rounds                           |
| `CORS_ORIGIN`            | No       | `*` / env value         | Allowed origins (comma-separated in prod)    |
| `RATE_LIMIT_WINDOW_MS`   | No       | `900000`                | Rate-limit window                            |
| `RATE_LIMIT_MAX`         | No       | `100`                   | General API requests/window                  |
| `RATE_LIMIT_AUTH_MAX`    | No       | `10`                    | Auth attempts/window                         |

---

## Available Scripts

| Script                                     | What it does                                           |
| ------------------------------------------ | ------------------------------------------------------ |
| `npm run dev`                              | Start development server with auto-restart             |
| `npm run build`                            | Compile TypeScript to `dist/`                          |
| `npm run start`                            | Run compiled server from `dist/server.js`              |
| `npm run lint`                             | Run ESLint on `src` and auto-fix                       |
| `npm run format`                           | Run Prettier on `src/**/*.ts`                          |
| `npm run module:create -- <Name>`          | Generate a new module scaffold and auto-register route |
| `npm run module:create:no-route -- <Name>` | Generate module scaffold without route registration    |
| `npm run prisma:generate`                  | Generate Prisma client                                 |
| `npm run prisma:migrate`                   | Prisma migrate command (mostly for SQL setups)         |
| `npm run prisma:studio`                    | Open Prisma Studio                                     |
| `npm run prisma:seed`                      | Seed default users                                     |
| `npm test`                                 | Run tests in-band                                      |
| `npm run test:watch`                       | Run tests in watch mode                                |
| `npm run test:coverage`                    | Generate coverage report                               |

---

## API & Swagger

### Base URL

```text
http://localhost:8000/api/v1
```

### Swagger docs

- UI: `http://localhost:8000/api/docs`
- JSON: `http://localhost:8000/api/docs.json`

> Swagger is enabled only when `NODE_ENV !== production`.

### Auth in Swagger

1. Call `POST /auth/login`
2. Copy `accessToken`
3. Click **Authorize** in Swagger UI
4. Paste token as `Bearer <accessToken>`

---

## Auth Module Guide

Auth routes are mounted under:

```text
/api/v1/auth
```

### Endpoint summary

| Method | Path               | Protected | Description                                        |
| ------ | ------------------ | --------- | -------------------------------------------------- |
| `POST` | `/register`        | No        | Register user and send email verification OTP      |
| `POST` | `/login`           | No        | Login and receive access + refresh tokens          |
| `POST` | `/refresh-token`   | No        | Rotate refresh token and issue new access token    |
| `POST` | `/logout`          | Yes       | Blacklist access token and delete refresh token    |
| `POST` | `/verify-email`    | No        | Verify email using OTP                             |
| `POST` | `/resend-otp`      | No        | Resend OTP for email verification/password reset   |
| `POST` | `/forgot-password` | No        | Send password reset OTP (no user-enumeration leak) |
| `POST` | `/verify-otp`      | No        | Verify reset OTP and receive a short-lived token   |
| `POST` | `/reset-password`  | No        | Reset password using reset token                   |
| `POST` | `/change-password` | Yes       | Change password with old password                  |
| `GET`  | `/me`              | Yes       | Get current profile                                |

### OTP behavior

- OTP validity is **10 minutes**
- Old unused OTPs for same purpose are invalidated when a new OTP is created
- Password reset flow is two-step: verify OTP first, then reset with short-lived token
- Reset password revokes all refresh tokens

### Typical auth flow (recommended)

1. Register
2. Verify email using OTP
3. Login
4. Use access token for protected routes
5. Refresh token when access token expires
6. Logout to invalidate token

### Password reset flow

1. Call `POST /forgot-password` with email
2. Call `POST /verify-otp` with email + OTP to receive `resetToken`
3. Call `POST /reset-password` with `resetToken` + `newPassword`

### Example requests

Register:

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secret123"
  }'
```

Verify email:

```bash
curl -X POST http://localhost:8000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "123456"
  }'
```

Login:

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secret123"
  }'
```

Get profile (`/me`):

```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Refresh token:

```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<REFRESH_TOKEN>"}'
```

---

## Request/Response Pattern

### Success response shape

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {}
}
```

### Error response shape

```json
{
  "success": false,
  "message": "Invalid token. Please log in again.",
  "errorMessages": [
    {
      "path": "token",
      "message": "jwt malformed"
    }
  ]
}
```

### Validation behavior

- Request body validation uses Zod
- Invalid payloads return `400` with structured error messages
- Global error handler normalizes known Prisma/JWT/Multer/Syntax errors

---

## How to Add a New Module

Use the generator script (recommended):

```bash
npm run module:create -- Book
```

This command creates:

1. `src/app/modules/Book/book.interface.ts`
2. `src/app/modules/Book/book.validation.ts`
3. `src/app/modules/Book/book.service.ts`
4. `src/app/modules/Book/book.controller.ts`
5. `src/app/modules/Book/book.route.ts`
6. Route registration in `src/app/routes/index.ts` as `/book`

More options:

```bash
# create module files but do not auto-register route
npm run module:create:no-route -- Product

# same behavior as module:create with explicit flag
npm run module:create -- Product --no-route

# overwrite existing generated files
npm run module:create -- Product --force
```

After generation:

1. Implement business logic in `*.service.ts`
2. Adjust validation schema in `*.validation.ts`
3. Update route auth/access rules in `*.route.ts`
4. (Optional) Extend Swagger definitions in `src/lib/swagger.ts`
5. Add tests under `src/__tests__/`

Recommended rule: **controller thin, service heavy**.

---

## Database & Prisma Notes

### Current Prisma models

- `User`
- `OtpToken`
- `RefreshToken`
- `Post`

### For MongoDB users

Use:

```bash
npx prisma db push
```

Useful commands:

```bash
npm run prisma:generate
npm run prisma:studio
npm run prisma:seed
```

---

## Testing Guide

### Run tests

```bash
npm test
```

### Watch mode

```bash
npm run test:watch
```

### Coverage

```bash
npm run test:coverage
```

### Existing test focus

- Health endpoints
- Auth validation checks
- Unauthorized/invalid token behavior
- Forgot-password user-enumeration-safe response behavior

---

## Logging Guide

Logs are stored in the `logs/` directory.

- `info-YYYY-MM-DD.log`
- `error-YYYY-MM-DD.log`

Features:

- Console logging with readable format
- JSON file logs for machine processing
- Daily rotation
- Separate retention for info/error logs

---

## Security Features

- Helmet headers
- CORS with production-origin support
- HPP (HTTP Parameter Pollution) protection
- JSON/body size limits (`10mb`)
- General rate limit on `/api`
- Strict auth rate limit on login/register/forgot-password/resend-otp
- JWT verification with clear expiration/invalid token handling
- Role-based route protection middleware
- Redis blacklist for invalidated tokens
- Account active-state checks during auth

---

## Troubleshooting (If You Get Stuck)

### 1) App exits immediately with missing env error

Cause: Required env vars are missing.

Fix:

1. Ensure `.env` exists
2. Set `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
3. Restart server

### 2) `PrismaClientInitializationError` or DB unreachable

Cause: MongoDB not running or bad URL.

Fix:

```bash
# local Mongo check (if installed locally)
mongosh
```

Then verify `DATABASE_URL` and rerun:

```bash
npx prisma db push
```

### 3) Redis connection warnings/errors

Cause: Redis not running or wrong host/port/password.

Fix:

```bash
# local Redis check
redis-cli ping
```

Expected: `PONG`

### 4) OTP email is not sent

Cause: Gmail credentials missing/invalid.

Fix:

- Set `EMAIL_SENDER_EMAIL`
- Set `EMAIL_SENDER_APP_PASS` (App Password, not normal account password)
- Check logs in `logs/error-*.log`

### 5) `401 Invalid token` on protected routes

Checklist:

- Use `Authorization: Bearer <ACCESS_TOKEN>`
- Ensure token is not expired
- Ensure token is not blacklisted after logout
- Try `POST /auth/refresh-token` with valid refresh token

### 6) Frequent `429 Too many requests`

Cause: Rate limiter triggered.

Fix:

- Wait for limiter window reset
- Increase `RATE_LIMIT_MAX` and `RATE_LIMIT_AUTH_MAX` in dev

### 7) Swagger page not visible

Cause: Running in production mode.

Fix:

- Swagger is disabled when `NODE_ENV=production`
- Run locally with `NODE_ENV=development`

### 8) Docker build works but app not healthy

Checklist:

- `docker compose logs -f app`
- confirm Mongo and Redis are healthy: `docker compose ps`
- check `.env` secrets and connection settings
- verify app responds: `curl http://localhost:8000/api/v1/health`

### 9) Seed command fails

Cause: DB not reachable or schema/client mismatch.

Fix:

```bash
npm run prisma:generate
npx prisma db push
npm run prisma:seed
```

---

## Production Deployment Checklist

Before going live:

- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Set `NODE_ENV=production`
- [ ] Set restricted `CORS_ORIGIN`
- [ ] Use managed MongoDB and Redis with authentication
- [ ] Ensure HTTPS at load balancer/proxy level
- [ ] Keep OTP sender credentials secure (secret manager)
- [ ] Monitor `logs/error-*.log` and integrate external observability
- [ ] Run `npm run build` and tests before deployment
- [ ] Validate health endpoint in deployment pipeline

---

## Final Notes

If you want to extend quickly, start by cloning the Auth module pattern and keep the same layering:

- `validation -> controller -> service -> prisma`

This keeps the codebase predictable and easy to maintain for teams.
