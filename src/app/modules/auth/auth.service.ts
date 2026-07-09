import { OtpPurpose } from "@prisma/client";
import crypto from "crypto";
import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../../errors/apiError";
import emailSender from "../../../helpers/email_sender/emailSender";
import prisma from "../../../lib/prisma";
import {
  acquireLock,
  blacklistToken,
  consumeResetToken,
  incrementOtpAttempts,
  incrementOtpIpAttempts,
  isOtpOnCooldown,
  isTokenBlacklisted,
  OTP_IP_MAX,
  OTP_MAX_ATTEMPTS,
  releaseLock,
  resetOtpAttempts,
  setOtpCooldown,
  storeResetToken,
} from "../../../lib/redisConnection";
import { otpEmail } from "../../../shared/emails/otpEmail";
import { passwordResetEmail } from "../../../shared/emails/passwordResetEmail";
import { generateOTP } from "../../../utils/generateOtp";
import {
  compareItem,
  compareOtp,
  hashItem,
  hashOtp,
  hashToken,
} from "../../../utils/hashAndCompareItem";
import { ITokenPayload, jwtHelpers } from "../../../utils/jwtHelpers";
import {
  IChangePasswordInput,
  IForgotPasswordInput,
  ILoginInput,
  IRefreshTokenInput,
  IResendOtpInput,
  IResetPasswordInput,
  IUser,
  IVerifyEmailInput,
  IVerifyOtpInput,
} from "./auth.interface";

const OTP_EXPIRY_MINUTES = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RefreshTokenMeta {
  userAgent?: string;
  ip?: string;
  familyId?: string;
}

const saveRefreshToken = async (userId: string, token: string, meta: RefreshTokenMeta = {}) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const tokenHash = hashToken(token);
  const jti = crypto.randomUUID();
  const familyId = meta.familyId ?? crypto.randomUUID();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      jti,
      familyId,
      expiresAt,
      userAgent: meta.userAgent,
      ip: meta.ip,
    },
  });
};

const createAndSendOtp = async (email: string, purpose: OtpPurpose, userId: string) => {
  // Invalidate previous unused OTPs for this purpose
  await prisma.otpToken.updateMany({
    where: { userId, purpose, used: false },
    data: { used: true },
  });

  const otp = generateOTP();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpToken.create({
    data: { userId, otpHash, purpose, expiresAt },
  });

  if (purpose === OtpPurpose.EMAIL_VERIFICATION) {
    await emailSender("Email Verification OTP", email, otpEmail(otp));
  } else {
    await emailSender("Password Reset OTP", email, passwordResetEmail(otp));
  }
};

// ---------------------------------------------------------------------------
// Service methods
// ---------------------------------------------------------------------------

const register = async (userData: IUser) => {
  const existing = await prisma.user.findUnique({
    where: { email: userData.email },
  });
  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, "Email is already registered.");
  }

  const hashedPassword = await hashItem(userData.password);

  const user = await prisma.user.create({
    data: {
      email: userData.email,
      name: userData.name,
      password: hashedPassword,
    },
    select: { id: true, name: true, email: true, role: true, isEmailVerified: true },
  });

  // Send verification OTP
  await createAndSendOtp(user.email, OtpPurpose.EMAIL_VERIFICATION, user.id);

  return user;
};

const login = async (loginData: ILoginInput, meta: RefreshTokenMeta = {}) => {
  const user = await prisma.user.findUnique({
    where: { email: loginData.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password.");
  }

  if (!user.isActive) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account has been deactivated.");
  }

  const isPasswordValid = await compareItem(loginData.password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password.");
  }

  const payload: ITokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const { accessToken, refreshToken } = jwtHelpers.generateAuthTokens(payload);

  await saveRefreshToken(user.id, refreshToken, {
    userAgent: meta.userAgent,
    ip: meta.ip,
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
  };
};

const refreshAccessToken = async ({ refreshToken, userAgent, ip }: IRefreshTokenInput) => {
  const tokenHash = hashToken(refreshToken);

  // ------------------------------------------------------------------
  // 1. Early exit: blacklist check (fast-fail for logged-out tokens)
  // ------------------------------------------------------------------
  if (await isTokenBlacklisted(refreshToken)) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token has been revoked.");
  }

  // ------------------------------------------------------------------
  // 2. Verify JWT signature + claims
  // ------------------------------------------------------------------
  let decoded: ITokenPayload & { jti?: string };
  try {
    decoded = jwtHelpers.verifyToken(refreshToken, config.jwt.refreshSecret) as ITokenPayload & {
      jti?: string;
    };
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired refresh token.");
  }

  // ------------------------------------------------------------------
  // 3. Acquire per-token distributed lock (serialise concurrent rotations)
  // ------------------------------------------------------------------
  const locked = await acquireLock(tokenHash);
  if (!locked) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Token is being refreshed by another request. Please retry."
    );
  }

  try {
    // ----------------------------------------------------------------
    // 4. Look up token in DB
    // ----------------------------------------------------------------
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token not found or expired.");
    }

    // ----------------------------------------------------------------
    // 5. Reuse detection — if already revoked, the family is compromised
    // ----------------------------------------------------------------
    if (storedToken.revokedAt) {
      // Poison the token in Redis so any in-flight request also fails
      await blacklistToken(refreshToken, 7 * 24 * 60 * 60);
      // Revoke the entire family
      await prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId },
        data: { revokedAt: new Date() },
      });
      throw new ApiError(httpStatus.UNAUTHORIZED, "Token reuse detected. All sessions revoked.");
    }

    // ----------------------------------------------------------------
    // 6. Atomically revoke the old token (conditional update)
    //    If count === 0, another request rotated it first → revoke family.
    // ----------------------------------------------------------------
    const { count: revokedCount } = await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (revokedCount === 0) {
      await blacklistToken(refreshToken, 7 * 24 * 60 * 60);
      await prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId },
        data: { revokedAt: new Date() },
      });
      throw new ApiError(httpStatus.UNAUTHORIZED, "Token reuse detected. All sessions revoked.");
    }

    // ----------------------------------------------------------------
    // 7. Blacklist old token (blocks any in-flight concurrent request)
    // ----------------------------------------------------------------
    await blacklistToken(refreshToken, 7 * 24 * 60 * 60);

    // ----------------------------------------------------------------
    // 8. Issue new token pair (same family)
    // ----------------------------------------------------------------
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User not found or account deactivated.");
    }

    const payload: ITokenPayload = { id: user.id, email: user.email, role: user.role };
    const { accessToken, refreshToken: newRefreshToken } = jwtHelpers.generateAuthTokens(payload);

    await saveRefreshToken(user.id, newRefreshToken, {
      familyId: storedToken.familyId,
      userAgent,
      ip,
    });

    return { accessToken, refreshToken: newRefreshToken };
  } finally {
    await releaseLock(tokenHash);
  }
};

const logout = async (accessToken: string, refreshToken?: string) => {
  // Blacklist the access token — decode to get TTL
  try {
    const decoded = jwtHelpers.verifyToken(accessToken, config.jwt.secret);
    const now = Math.floor(Date.now() / 1000);
    const ttl = (decoded.exp ?? now + 900) - now;
    if (ttl > 0) {
      await blacklistToken(accessToken, ttl);
    }
  } catch {
    // Token expired already — that's fine
  }

  // Remove refresh token from DB
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }
};

const verifyEmail = async ({ email, otp, ip }: IVerifyEmailInput & { ip?: string }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }
  if (user.isEmailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email is already verified.");
  }

  // --- Rate-limit checks ---
  if (await isOtpOnCooldown(user.id, OtpPurpose.EMAIL_VERIFICATION)) {
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      "Too many failed attempts. Please wait 15 minutes or request a new OTP."
    );
  }
  if (ip && (await incrementOtpIpAttempts(ip)) > OTP_IP_MAX) {
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      "Too many OTP attempts from this IP. Please try again later."
    );
  }

  const otpRecords = await prisma.otpToken.findMany({
    where: {
      userId: user.id,
      purpose: OtpPurpose.EMAIL_VERIFICATION,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  // Compare OTP against stored hashes
  let otpRecord: (typeof otpRecords)[number] | null = null;
  for (const record of otpRecords) {
    if (compareOtp(otp, record.otpHash)) {
      otpRecord = record;
      break;
    }
  }

  if (!otpRecord) {
    const attempts = await incrementOtpAttempts(user.id, OtpPurpose.EMAIL_VERIFICATION);
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await setOtpCooldown(user.id, OtpPurpose.EMAIL_VERIFICATION);
      throw new ApiError(
        httpStatus.TOO_MANY_REQUESTS,
        "Too many failed attempts. Please wait 15 minutes or request a new OTP."
      );
    }
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired OTP.");
  }

  // Success — reset counters
  await resetOtpAttempts(user.id, OtpPurpose.EMAIL_VERIFICATION);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    }),
    prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { used: true },
    }),
  ]);
};

const resendOtp = async ({ email, purpose }: IResendOtpInput) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  if (purpose === "EMAIL_VERIFICATION" && user.isEmailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email is already verified.");
  }

  await createAndSendOtp(email, purpose as OtpPurpose, user.id);
};

const forgotPassword = async ({ email }: IForgotPasswordInput) => {
  const user = await prisma.user.findUnique({ where: { email } });
  // Return success even if user not found (security: don't confirm email existence)
  if (!user) return;

  await createAndSendOtp(email, OtpPurpose.PASSWORD_RESET, user.id);
};

const verifyOtp = async ({ email, otp, ip }: IVerifyOtpInput & { ip?: string }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  // --- Rate-limit checks ---
  if (await isOtpOnCooldown(user.id, OtpPurpose.PASSWORD_RESET)) {
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      "Too many failed attempts. Please wait 15 minutes or request a new OTP."
    );
  }
  if (ip && (await incrementOtpIpAttempts(ip)) > OTP_IP_MAX) {
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      "Too many OTP attempts from this IP. Please try again later."
    );
  }

  const otpRecords = await prisma.otpToken.findMany({
    where: {
      userId: user.id,
      purpose: OtpPurpose.PASSWORD_RESET,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  // Compare OTP against stored hashes
  let otpRecord: (typeof otpRecords)[number] | null = null;
  for (const record of otpRecords) {
    if (compareOtp(otp, record.otpHash)) {
      otpRecord = record;
      break;
    }
  }

  if (!otpRecord) {
    const attempts = await incrementOtpAttempts(user.id, OtpPurpose.PASSWORD_RESET);
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await setOtpCooldown(user.id, OtpPurpose.PASSWORD_RESET);
      throw new ApiError(
        httpStatus.TOO_MANY_REQUESTS,
        "Too many failed attempts. Please wait 15 minutes or request a new OTP."
      );
    }
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired OTP.");
  }

  // Success — reset counters
  await resetOtpAttempts(user.id, OtpPurpose.PASSWORD_RESET);

  await prisma.otpToken.update({
    where: { id: otpRecord.id },
    data: { used: true },
  });

  // --- Issue a single-use, purpose-scoped reset token ---
  const jti = crypto.randomUUID();
  const resetToken = jwtHelpers.generateToken(
    {
      sub: user.id,
      email: user.email,
      purpose: "PASSWORD_RESET",
      jti,
    },
    config.jwt.resetSecret,
    config.jwt.resetExpiresIn
  );

  // Store token hash server-side so it can only be consumed once
  await storeResetToken(hashToken(resetToken), user.id);

  return { resetToken };
};

const resetPassword = async ({ resetToken, newPassword }: IResetPasswordInput) => {
  // 1. Verify JWT signature + claims
  let decoded: { sub: string; email: string; purpose: string; jti: string };
  try {
    decoded = jwtHelpers.verifyToken(resetToken, config.jwt.resetSecret) as {
      sub: string;
      email: string;
      purpose: string;
      jti: string;
    };
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired reset token.");
  }

  if (decoded.purpose !== "PASSWORD_RESET") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid token purpose.");
  }

  // 2. Consume token atomically — fails if already used or expired
  const tokenUserId = await consumeResetToken(hashToken(resetToken));
  if (!tokenUserId || tokenUserId !== decoded.sub) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Reset token has already been used or is invalid.");
  }

  // 3. Apply the password change
  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  const hashedPassword = await hashItem(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    }),
    // Revoke all refresh tokens on password reset
    prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
  ]);
};

const changePassword = async (userId: string, data: IChangePasswordInput) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  const isOldPasswordValid = await compareItem(data.oldPassword, user.password);
  if (!isOldPasswordValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Old password is incorrect.");
  }

  const hashedPassword = await hashItem(data.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // Revoke all refresh tokens
  await prisma.refreshToken.deleteMany({ where: { userId } });
};

const getMe = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isEmailVerified: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }
  return user;
};

export const AuthService = {
  register,
  login,
  refreshAccessToken,
  logout,
  verifyEmail,
  resendOtp,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
  getMe,
};
