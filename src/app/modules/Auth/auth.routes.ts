import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { authValidation } from "./auth.validation";

const router = express.Router();

// user login route
router.post("/login", AuthController.loginUser);

router.post("/otp-enter", AuthController.enterOtp);

// user logout route
router.post("/logout", AuthController.logoutUser);

router.get(
  "/get-me",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STUDENT),
  AuthController.getMyProfile
);

router.put(
  "/change-password",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STUDENT),
  validateRequest(authValidation.changePasswordValidationSchema),
  AuthController.changePassword
);

router.post("/forgot-password", AuthController.forgotPassword);

router.post("/reset-password", AuthController.resetPassword);

export const AuthRoutes = router;
