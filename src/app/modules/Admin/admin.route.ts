import { UserRole } from "@prisma/client";
import express from "express";
import { fileUploader } from "../../../helpars/fileUploader";
import auth from "../../middlewares/auth";
import { AdminController } from "./admin.controller";

const router = express.Router();

const uploadSingle = fileUploader.upload.single("profileImage");

router.post(
  "/create-admin",
  auth(UserRole.SUPER_ADMIN),
  uploadSingle,
  AdminController.createAdmin
);

router.get(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AdminController.getAdminById
);
router.put(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AdminController.updateAdmin
);
router.patch("/:id", auth(UserRole.SUPER_ADMIN), AdminController.deleteAdmin);
router.get("/", auth(UserRole.SUPER_ADMIN), AdminController.getAllAdmins);

export const AdminRoutes = router;
