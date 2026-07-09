import * as bcrypt from "bcryptjs";
import crypto from "crypto";
import config from "../config";

export const hashItem = async (item: string): Promise<string> => {
  const saltRounds = Number(config.password_salt || 12);
  return await bcrypt.hash(item, saltRounds);
};

export const compareItem = async (item: string, hashedItem: string): Promise<boolean> => {
  return await bcrypt.compare(item, hashedItem);
};

// SHA-256 hash for opaque tokens (refresh tokens, JWT identifiers)
export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Fast peppered SHA-256 for short-lived secrets (OTPs)
// Much faster than bcrypt (~0.1ms vs ~250ms) — safe here because OTPs
// are 6-digit, rate-limited, and expire in 10 minutes.
export const hashOtp = (otp: string): string => {
  return crypto
    .createHash("sha256")
    .update(otp + config.jwt.secret) // pepper = JWT secret
    .digest("hex");
};

export const compareOtp = (otp: string, otpHash: string): boolean => {
  return hashOtp(otp) === otpHash;
};
