import { Router } from "express";
import { TestController } from "./test.controller";

const router = Router();

// Define test routes
router.get("/", TestController.getAllTests);
router.post("/", TestController.createTest);
router.get("/:id", TestController.getSingleTest);
router.patch("/:id", TestController.updateTest);
router.delete("/:id", TestController.deleteTest);

export const TestRoutes = router;
