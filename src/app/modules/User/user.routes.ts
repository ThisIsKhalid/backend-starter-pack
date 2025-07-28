import { UserRole } from "@prisma/client";
import express from "express";
import { upload } from "../../../helpars/file/fileUploader";
import auth from "../../middlewares/auth";
import { UserController } from "./user.controller";

const router = express.Router();

const singleUpload = upload.single("image");

router.post("/create-user", UserController.createUser);

router.post("/create-social-user", UserController.createSocialUser);

router.patch("/update-user", auth(), singleUpload, UserController.updateUser);

router.patch(
  "/update-status/:id",
  auth(UserRole.ADMIN),
  UserController.updateStatus
);

router.get("/", UserController.allUsers);

export const UserRoutes = router;
