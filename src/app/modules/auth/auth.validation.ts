import { z } from "zod";

const createUserZodSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),
});

const loginZodSchema = z.object({
  body: z.object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

const refreshTokenZodSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

const forgotPasswordZodSchema = z.object({
  body: z.object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
  }),
});

const verifyOtpZodSchema = z.object({
  body: z.object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
  }),
});

const resetPasswordZodSchema = z.object({
  body: z.object({
    resetToken: z.string().min(1, "Reset token is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters long"),
  }),
});

const verifyEmailZodSchema = z.object({
  body: z.object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
  }),
});

const resendOtpZodSchema = z.object({
  body: z.object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    purpose: z.enum(["EMAIL_VERIFICATION", "PASSWORD_RESET"]),
  }),
});

const changePasswordZodSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters long"),
  }),
});

export const AuthValidation = {
  createUserZodSchema,
  loginZodSchema,
  refreshTokenZodSchema,
  forgotPasswordZodSchema,
  verifyOtpZodSchema,
  resetPasswordZodSchema,
  verifyEmailZodSchema,
  resendOtpZodSchema,
  changePasswordZodSchema,
};
