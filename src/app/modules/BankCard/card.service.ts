import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { Card } from "./card.interface";

// Create a new card
const createCardInfoInDB = async (payload: Card, email: string) => {
  const existingCard = await prisma.card.findUnique({
    where: {
      cardNumber: payload.cardNumber,
    },
  });

  if (existingCard) {
    throw new ApiError(400, "This card information already exists");
  }

  const result = await prisma.$transaction(async (TransactionClient) => {
    const card = await TransactionClient.card.create({
      data: {
        cardHolderName: payload.cardHolderName,
        cardNumber: payload.cardNumber,
        expiryMonth: payload.expiryMonth,
        expiryYear: payload.expiryYear,
        cvv: payload.cvv,
        zipCode: payload.zipCode,
        billingAddress: payload.billingAddress,
        userEmail: email,
      },
    });

    return card;
  });

  return result;
};

// Get all cards
const getAllCardInfoFromDB = async (email: string) => {
  const result = await prisma.card.findMany({
    where: {
      userEmail: email,
    },
    include: {
      user: {
        select: {
          email: true,
          userStatus: true,
        },
      },
    },
  });
  return result;
};

// Get card by ID
const getCardInfoByIdFromDB = async (id: string) => {
  const numericId = parseInt(id, 10);

  const result = await prisma.card.findUnique({
    where: {
      id: numericId,
    },
    include: {
      user: {
        select: {
          email: true,
          userStatus: true,
        },
      },
    },
  });

  if (!result) {
    throw new ApiError(404, "Card information not found");
  }

  return result;
};

// Update a card
const updateCardInfoInDB = async (payload: Card, id: string) => {
  const existingCard = await prisma.card.findUnique({
    where: {
      id: parseInt(id, 10),
    },
  });

  if (!existingCard) {
    throw new ApiError(404, "Card information not found");
  }

  const result = await prisma.card.update({
    where: {
      id: existingCard.id,
    },
    data: {
      cardHolderName: payload.cardHolderName ?? existingCard.cardHolderName,
      cardNumber: payload.cardNumber ?? existingCard.cardNumber,
      expiryMonth: payload.expiryMonth ?? existingCard.expiryMonth,
      expiryYear: payload.expiryYear ?? existingCard.expiryYear,
      cvv: payload.cvv ?? existingCard.cvv,
      zipCode: payload.zipCode ?? existingCard.zipCode,
      billingAddress: payload.billingAddress ?? existingCard.billingAddress,
      updatedAt: new Date(),
    },
  });

  return result;
};

// Delete a card (Soft delete)
const deleteCardInfoFromDB = async (id: string) => {
  const numericId = parseInt(id, 10);

  const existingCard = await prisma.card.findUnique({
    where: {
      id: numericId,
    },
  });

  if (!existingCard) {
    throw new ApiError(404, "Card information not found");
  }

  const result = await prisma.card.delete({
    where: {
      id: numericId,
    },
  });

  return result;
};

export const cardServices = {
  createCardInfoInDB,
  getAllCardInfoFromDB,
  getCardInfoByIdFromDB,
  updateCardInfoInDB,
  deleteCardInfoFromDB,
};
