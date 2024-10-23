import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { bankAccountController } from "./bankAccount.controller";
import { BankAccountValidation } from "./bankAccount.validation";

const router = express.Router();

router.post(
  "/create-bank-account",
  auth(UserRole.HELPER, UserRole.CUSTOMER),
  validateRequest(BankAccountValidation.createBankAccountSchema),
  bankAccountController.createBankAccountInfo
);

router.get(
  "/",
  auth(UserRole.HELPER, UserRole.CUSTOMER),
  bankAccountController.getAllBankAccountInfo
);

router.get("/:id", bankAccountController.getBankAccountInfoById);

router.patch(
  "/:id",
  auth(UserRole.HELPER, UserRole.CUSTOMER),
  bankAccountController.updateBankAccountInfo
);

router.delete(
  "/:id",
  auth(UserRole.HELPER, UserRole.CUSTOMER),
  bankAccountController.deleteBankAccountInfo
);

export const bankAccountRoutes = router;
