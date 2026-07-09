import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Normalise an email: trim whitespace and lowercase. */
const normalisedEmail = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address")
  .trim()
  .toLowerCase();

// ---------------------------------------------------------------------------
// Schemas — every body schema uses `.strict()` to reject unknown fields.
// ---------------------------------------------------------------------------

const createUserZodSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, "Name is required"),
      email: normalisedEmail,
      password: z.string().min(6, "Password must be at least 6 characters long"),
    })
    .strict(),
});

const loginZodSchema = z.object({
  body: z
    .object({
      email: normalisedEmail,
      password: z.string().min(1, "Password is required"),
    })
    .strict(),
});

const refreshTokenZodSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().min(1, "Refresh token is required"),
    })
    .strict(),
});

const forgotPasswordZodSchema = z.object({
  body: z
    .object({
      email: normalisedEmail,
    })
    .strict(),
});

const verifyOtpZodSchema = z.object({
  body: z
    .object({
      email: normalisedEmail,
      otp: z.string().length(6, "OTP must be exactly 6 digits"),
    })
    .strict(),
});

const resetPasswordZodSchema = z.object({
  body: z
    .object({
      resetToken: z.string().min(1, "Reset token is required"),
      newPassword: z.string().min(6, "Password must be at least 6 characters long"),
    })
    .strict(),
});

const verifyEmailZodSchema = z.object({
  body: z
    .object({
      email: normalisedEmail,
      otp: z.string().length(6, "OTP must be exactly 6 digits"),
    })
    .strict(),
});

const resendOtpZodSchema = z.object({
  body: z
    .object({
      email: normalisedEmail,
      purpose: z.enum(["EMAIL_VERIFICATION", "PASSWORD_RESET"]),
    })
    .strict(),
});

const changePasswordZodSchema = z.object({
  body: z
    .object({
      oldPassword: z.string().min(1, "Old password is required"),
      newPassword: z.string().min(6, "New password must be at least 6 characters long"),
    })
    .strict(),
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
