import { UserRole } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

const createChat = async (
  orderId: number,
  customerId: number,
  helperId: number
) => {
  const chat = await prisma.chat.create({
    data: {
      orderId,
      customerId,
      helperId,
    },
  });

  return chat;
};

const getChatByOrderId = async (orderId: number) => {
  const isOrderExist = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!isOrderExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  const chat = await prisma.chat.findUnique({
    where: {
      orderId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
      helper: true,
      customer: true,
      order: true,
    },
  });

  if (!chat) {
    throw new ApiError(httpStatus.NOT_FOUND, "Chat has not been created yet");
  }

  return chat;
};

const addMessage = async (
  chatId: number,
  senderId: number,
  content: string,
  senderRole: UserRole
) => {
  const message = await prisma.message.create({
    data: {
      chatId,
      senderId,
      content,
      senderRole,
    },
  });

  return message;
};

export const chatServices = {
  createChat,
  getChatByOrderId,
  addMessage,
};
