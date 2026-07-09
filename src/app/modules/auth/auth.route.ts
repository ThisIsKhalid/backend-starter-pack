import express from "express";
import {
  authenticatedPolicy,
  loginPolicy,
  otpIssuePolicy,
  otpVerifyPolicy,
  passwordResetPolicy,
  refreshTokenPolicy,
  registerPolicy,
} from "../../../config/rateLimitPolicies";
import auth from "../../middlewares/auth";
import { rateLimiter } from "../../middlewares/rateLimiter";
import { RequestValidation } from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = express.Router();

// Public routes
router.post(
  "/register",
  rateLimiter(registerPolicy),
  RequestValidation.validateRequest(AuthValidation.createUserZodSchema),
  AuthController.register
);

router.post(
  "/login",
  rateLimiter(loginPolicy),
  RequestValidation.validateRequest(AuthValidation.loginZodSchema),
  AuthController.login
);

router.post(
  "/refresh-token",
  rateLimiter(refreshTokenPolicy),
  RequestValidation.validateRequest(AuthValidation.refreshTokenZodSchema),
  AuthController.refreshToken
);

router.post(
  "/forgot-password",
  rateLimiter(otpIssuePolicy),
  RequestValidation.validateRequest(AuthValidation.forgotPasswordZodSchema),
  AuthController.forgotPassword
);

router.post(
  "/verify-otp",
  rateLimiter(otpVerifyPolicy),
  RequestValidation.validateRequest(AuthValidation.verifyOtpZodSchema),
  AuthController.verifyOtp
);

router.post(
  "/reset-password",
  rateLimiter(passwordResetPolicy),
  RequestValidation.validateRequest(AuthValidation.resetPasswordZodSchema),
  AuthController.resetPassword
);

router.post(
  "/verify-email",
  rateLimiter(otpVerifyPolicy),
  RequestValidation.validateRequest(AuthValidation.verifyEmailZodSchema),
  AuthController.verifyEmail
);

router.post(
  "/resend-otp",
  rateLimiter(otpIssuePolicy),
  RequestValidation.validateRequest(AuthValidation.resendOtpZodSchema),
  AuthController.resendOtp
);

// Protected routes
router.post("/logout", auth("USER", "ADMIN", "SUPER_ADMIN"), AuthController.logout);

router.get(
  "/me",
  rateLimiter(authenticatedPolicy),
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  AuthController.getMe
);

router.post(
  "/change-password",
  rateLimiter(authenticatedPolicy),
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  RequestValidation.validateRequest(AuthValidation.changePasswordZodSchema),
  AuthController.changePassword
);

export const AuthRoutes = router;
