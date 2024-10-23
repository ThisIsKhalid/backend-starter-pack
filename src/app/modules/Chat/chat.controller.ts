import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { chatServices } from "./chat.services";

const createChatHandler = catchAsync(async (req: Request, res: Response) => {
  const { orderId, customerId, helperId } = req.body;

  const chat = await chatServices.createChat(orderId, customerId, helperId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Chatroom created successfully",
    data: chat,
  });
});

const getChatHandler = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const chat = await chatServices.getChatByOrderId(Number(orderId));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Chatroom fetched successfully",
    data: chat,
  });
});

const addMessageHandler = catchAsync(async (req: Request, res: Response) => {
  const { chatId, senderId, content, senderRole } = req.body;

  const message = await chatServices.addMessage(chatId, senderId, content, senderRole);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message added successfully",
    data: message,
  });
});

export const chatController = {
  createChatHandler,
  getChatHandler,
  addMessageHandler,
};
