import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { cardController } from "./card.controller";
import { CardValidation } from "./card.validation";

const router = express.Router();

router.post(
  "/create-card",
  auth(UserRole.HELPER, UserRole.CUSTOMER),
  validateRequest(CardValidation.createCardSchema),
  cardController.createCardInfo
);

router.get(
  "/",
  auth(UserRole.HELPER, UserRole.CUSTOMER),
  cardController.getAllCardInfo
);

router.get("/:id", cardController.getCardInfoById);

router.patch(
  "/:id",
  auth(UserRole.HELPER, UserRole.CUSTOMER),
  validateRequest(CardValidation.updateCardSchema),
  cardController.updateCardInfo
);

router.delete(
  "/:id",
  auth(UserRole.HELPER, UserRole.CUSTOMER),
  cardController.deleteCardInfo
);

export const cardRoutes = router;
