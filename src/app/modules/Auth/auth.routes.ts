import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { authValidation } from "./auth.validation";
import passport from "../../../helpars/passport";

const router = express.Router();


router.post("/login-with-email", AuthController.loginUserWithEmail);

router.get("/login-with-google", passport.authenticate('google', {scope: ['profile', "email"]}));

router.get("/callback/google", passport.authenticate('google', {
    session: false,

}), AuthController.loginWithGoogle)


router.get("/login-with-facebook", passport.authenticate('facebook', {scope: ["email"]}));


router.get("/facebook/callback", passport.authenticate('facebook', {
    session: false,
    failureRedirect: "/login"
}), AuthController.loginWithFacebook)



router.post("/verify-otp", AuthController.verifyUserByOTP);

// user logout route
router.post("/logout", AuthController.logoutUser);

router.get(
  "/get-me",
  auth(),
  AuthController.getMyProfile
);

router.put(
  "/change-password",
  auth(),
  validateRequest(authValidation.changePasswordValidationSchema),
  AuthController.changePassword
);

router.post("/forget-password", AuthController.forgetPassword);

router.post("/reset-password", AuthController.resetPassword);

export const AuthRoutes = router;
