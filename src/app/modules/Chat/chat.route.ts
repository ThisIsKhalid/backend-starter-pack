import { Router } from "express";
import { chatController } from "./chat.controller";

const router = Router();

router.post("/create-chat", chatController.createChatHandler);
router.get("/:orderId", chatController.getChatHandler);
router.post("/messages", chatController.addMessageHandler);

export const chatRoutes = router;
