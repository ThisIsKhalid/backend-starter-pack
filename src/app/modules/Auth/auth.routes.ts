import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { AuthController } from "./auth.controller";

const router = express.Router();

router.post("/login", AuthController.loginUser);

router.post("/forgot-password", AuthController.forgetPassword);

router.patch("/reset-password", auth(), AuthController.resetPassword);

router.patch("/verify-otp", AuthController.verifyUserByOTP);

router.patch(
  "/logout",
  auth(UserRole.ADMIN, UserRole.USER),
  AuthController.logOutUser
);

router.get("/refresh-token", AuthController.refreshToken);

router.get(
  "/me",
  auth(UserRole.ADMIN, UserRole.USER),
  AuthController.getMyProfile
);

export const AuthRoutes = router;
