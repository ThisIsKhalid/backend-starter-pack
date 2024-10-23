import { UserRole } from "@prisma/client";
import express from "express";
import { fileUploader } from "../../../helpars/fileUploader";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { helperController } from "./helper.controller";
import { helperSchema } from "./helper.validation";

const router = express.Router();

const uploadMultiple = fileUploader.upload.fields([
  { name: "licenseImage", maxCount: 1 },
  { name: "insurenceImage", maxCount: 1 },
  { name: "profileImage", maxCount: 1 },
]);

router.put("/:id", uploadMultiple, helperController.updateHelperInfo);

router.post(
  "/create-helper",
  uploadMultiple,
  helperController.createHelperInfo
);

router.get("/", helperController.getAllHelperInfo);

router.get("/:id", helperController.getHelperInfoById);

router.patch(
  "/:id",
  auth(UserRole.HELPER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  helperController.deleteHelperInfo
);

export const helperRoutes = router;
