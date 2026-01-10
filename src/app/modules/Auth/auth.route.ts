import express, { Request, Response } from "express";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get("/me", auth("USER"), (req: Request, res: Response) => {
  res.status(200).json({
    status: "Success",
    message: "Get me",
  });
});

export const AuthRoutes = router;
