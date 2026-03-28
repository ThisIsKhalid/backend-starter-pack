import { OtpPurpose } from "@prisma/client";
import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../../errors/apiError";
import emailSender from "../../../helpers/email_sender/emailSender";
import prisma from "../../../lib/prisma";
import { blacklistToken, isTokenBlacklisted } from "../../../lib/redisConnection";
import { otpEmail } from "../../../shared/emails/otpEmail";
import { passwordResetEmail } from "../../../shared/emails/passwordResetEmail";
import { generateOTP } from "../../../utils/generateOtp";
import { compareItem, hashItem } from "../../../utils/hashAndCompareItem";
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

const saveRefreshToken = async (userId: string, token: string) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
  await prisma.refreshToken.create({
    data: { userId, token, expiresAt },
  });
};

const createAndSendOtp = async (email: string, purpose: OtpPurpose, userId: string) => {
  // Invalidate previous unused OTPs for this purpose
  await prisma.otpToken.updateMany({
    where: { userId, purpose, used: false },
    data: { used: true },
  });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpToken.create({
    data: { userId, otp, purpose, expiresAt },
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

const login = async (loginData: ILoginInput) => {
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

  await saveRefreshToken(user.id, refreshToken);

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

const refreshAccessToken = async ({ refreshToken }: IRefreshTokenInput) => {
  // Check blacklist
  const blacklisted = await isTokenBlacklisted(refreshToken);
  if (blacklisted) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token has been revoked.");
  }

  let decoded: ITokenPayload;
  try {
    decoded = jwtHelpers.verifyToken(refreshToken, config.jwt.refreshSecret) as ITokenPayload;
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired refresh token.");
  }

  // Verify token exists in DB
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token not found or expired.");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not found or account deactivated.");
  }

  const payload: ITokenPayload = { id: user.id, email: user.email, role: user.role };
  const { accessToken, refreshToken: newRefreshToken } = jwtHelpers.generateAuthTokens(payload);

  // Rotate refresh token: delete old, save new
  await prisma.refreshToken.delete({ where: { token: refreshToken } });
  await saveRefreshToken(user.id, newRefreshToken);

  return { accessToken, refreshToken: newRefreshToken };
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
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
};

const verifyEmail = async ({ email, otp }: IVerifyEmailInput) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }
  if (user.isEmailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email is already verified.");
  }

  const otpRecord = await prisma.otpToken.findFirst({
    where: {
      userId: user.id,
      otp,
      purpose: OtpPurpose.EMAIL_VERIFICATION,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otpRecord) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired OTP.");
  }

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

const verifyOtp = async ({ email, otp }: IVerifyOtpInput) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  const otpRecord = await prisma.otpToken.findFirst({
    where: {
      userId: user.id,
      otp,
      purpose: OtpPurpose.PASSWORD_RESET,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otpRecord) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired OTP.");
  }

  await prisma.otpToken.update({
    where: { id: otpRecord.id },
    data: { used: true },
  });

  const resetToken = jwtHelpers.generateToken({ email: user.email }, config.jwt.secret, "10m");

  return { resetToken };
};

const resetPassword = async ({ resetToken, newPassword }: IResetPasswordInput) => {
  let decoded: { email: string };
  try {
    decoded = jwtHelpers.verifyToken(resetToken, config.jwt.secret) as { email: string };
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired reset token.");
  }

  const user = await prisma.user.findUnique({ where: { email: decoded.email } });
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
