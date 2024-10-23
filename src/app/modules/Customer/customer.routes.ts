import { UserRole } from "@prisma/client";
import express from "express";
import { fileUploader } from "../../../helpars/fileUploader";
import auth from "../../middlewares/auth";
import { customerController } from "./customer.controller";

const router = express.Router();

const uploadSingle = fileUploader.upload.single("profileImage");

router.post(
  "/create-customer",
  uploadSingle,
  customerController.createCustomerInfo
);

router.get("/", customerController.getAllCustomerInfo);

router.get("/:id", customerController.getCustomerInfoById);

router.put("/:id", uploadSingle, customerController.updateCustomerInfo);

router.patch(
  "/:id",
  auth(UserRole.CUSTOMER, UserRole.ADMIN),
  customerController.deleteCustomerInfo
);

export const customerRoutes = router;
