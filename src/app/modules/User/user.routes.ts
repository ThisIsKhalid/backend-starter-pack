import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { UserController } from "./user.controller";

const router = express.Router();

router.post("/create-deen-user", UserController.createDeenUser);

router.post("/create-social-user", UserController.createSocialUser);

router.patch(
  "/update-status/:id",
  auth(UserRole.ADMIN),
  UserController.updateStatus
);

router.get("/", UserController.allUsers);

export const UserRoutes = router;
