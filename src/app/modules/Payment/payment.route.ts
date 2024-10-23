import { UserRole } from "@prisma/client";
import express from "express";
import stripe from "../../../helpars/stripe";
import prisma from "../../../shared/prisma";
import auth from "../../middlewares/auth";
import { paymentController } from "./payment.controller";

const router = express.Router();

// router.post("/account/get", paymentController.getStripeAccount);

// router.post("/account/setup", paymentController.setupStripeAccount);

router.get(
  "/connect-helper",
  auth(UserRole.HELPER),
  paymentController.connectHelper
);

// Endpoint to handle the OAuth callback from Stripe
router.get("/oauth/callback", paymentController.handlteOAuthCallback);

router.get("/verify-session", paymentController.verifySession);

router.post(
  "/create-checkout-session",
  paymentController.createCheckoutSession
);

export const paymentRoutes = router;
