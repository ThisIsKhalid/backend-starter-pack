import express from "express";
import auth from "../../middlewares/auth";
import { RequestValidation } from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = express.Router();

// Public routes
router.post(
  "/register",
  RequestValidation.validateRequest(AuthValidation.createUserZodSchema),
  AuthController.register
);

router.post(
  "/login",
  RequestValidation.validateRequest(AuthValidation.loginZodSchema),
  AuthController.login
);

router.post(
  "/refresh-token",
  RequestValidation.validateRequest(AuthValidation.refreshTokenZodSchema),
  AuthController.refreshToken
);

router.post(
  "/forgot-password",
  RequestValidation.validateRequest(AuthValidation.forgotPasswordZodSchema),
  AuthController.forgotPassword
);

router.post(
  "/verify-otp",
  RequestValidation.validateRequest(AuthValidation.verifyOtpZodSchema),
  AuthController.verifyOtp
);

router.post(
  "/reset-password",
  RequestValidation.validateRequest(AuthValidation.resetPasswordZodSchema),
  AuthController.resetPassword
);

router.post(
  "/verify-email",
  RequestValidation.validateRequest(AuthValidation.verifyEmailZodSchema),
  AuthController.verifyEmail
);

router.post(
  "/resend-otp",
  RequestValidation.validateRequest(AuthValidation.resendOtpZodSchema),
  AuthController.resendOtp
);

// Protected routes
router.post("/logout", auth("USER", "ADMIN", "SUPER_ADMIN"), AuthController.logout);

router.get("/me", auth("USER", "ADMIN", "SUPER_ADMIN"), AuthController.getMe);

router.post(
  "/change-password",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  RequestValidation.validateRequest(AuthValidation.changePasswordZodSchema),
  AuthController.changePassword
);

export const AuthRoutes = router;
