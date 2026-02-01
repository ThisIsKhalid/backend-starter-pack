import express, { Request, Response } from "express";
import auth from "../../middlewares/auth";
import { AuthController } from "./auth.controller";

const router = express.Router();

router.post("/register", AuthController.createUser);

router.get("/me", auth("USER"), AuthController.getMe);

export const AuthRoutes = router;
