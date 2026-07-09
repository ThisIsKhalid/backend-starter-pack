#!/usr/bin/env node

/**
 * Ensure TTL indexes exist on MongoDB collections.
 *
 * MongoDB TTL indexes are NOT supported by Prisma's @@index directive,
 * so they must be created directly on the database.
 *
 * Run once after schema migration:
 *   npx tsx prisma/ensure-ttl-indexes.ts
 *
 * Safe to run repeatedly — createIndex is idempotent when options match.
 */

import { MongoClient } from "mongodb";
import config from "../../config";

const MONGO_URL = config.app.databaseUrl;

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();

  // Extract database name from the URL
  const dbName = new URL(MONGO_URL).pathname.replace("/", "") || "backend_starter";
  const db = client.db(dbName);

  // console.log(`\n🔧 Ensuring TTL indexes on database: ${dbName}\n`);

  // -----------------------------------------------------------------------
  // OtpToken: auto-delete expired OTPs
  //   expireAfterSeconds = 0  →  MongoDB deletes the document when expiresAt < now()
  // -----------------------------------------------------------------------
  await db
    .collection("OtpToken")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "ttl_otpToken_expiresAt" });
  // console.log("  ✅ OtpToken.expiresAt TTL index (expireAfterSeconds: 0)");

  // -----------------------------------------------------------------------
  // RefreshToken: auto-delete expired refresh tokens
  // -----------------------------------------------------------------------
  await db
    .collection("RefreshToken")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "ttl_refreshToken_expiresAt" });
  // console.log("  ✅ RefreshToken.expiresAt TTL index (expireAfterSeconds: 0)");

  // -----------------------------------------------------------------------
  // EmailJob: auto-delete old completed/failed jobs after 7 days
  //   Note: TTL on createdAt + 604800s (7 days) means ALL email jobs are
  //   cleaned up after 7 days regardless of status.  The cleanup worker
  //   handles more targeted pruning of SENT/FAILED jobs earlier.
  // -----------------------------------------------------------------------
  await db
    .collection("EmailJob")
    .createIndex({ createdAt: 1 }, { expireAfterSeconds: 604800, name: "ttl_emailJob_createdAt" });
  // console.log("  ✅ EmailJob.createdAt TTL index (expireAfterSeconds: 604800 = 7 days)");

  // console.log("\n🎉 Done.\n");
  await client.close();
}

main().catch((err) => {
  console.error("❌ Failed to create TTL indexes:", err);
  process.exit(1);
});
