import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { BankAccount } from "./bankAccount.interface";

// Create a new bank account
const createBankAccountInfoInDB = async (
  payload: BankAccount,
  email: string
) => {
  const existingBankAccount = await prisma.bankAccount.findUnique({
    where: {
      accountNumber: payload.accountNumber,
    },
  });

  if (existingBankAccount) {
    throw new ApiError(400, "This bank account information already exists");
  }

  const result = await prisma.$transaction(async (TransactionClient) => {
    const bankAccount = await TransactionClient.bankAccount.create({
      data: {
        routingNumber: payload.routingNumber,
        accountNumber: payload.accountNumber,
        accountType: payload.accountType,
        userEmail: email,
      },
    });

    return bankAccount;
  });

  return result;
};

// Get all bank accounts
const getAllBankAccountInfoFromDB = async (email: string) => {
  const result = await prisma.bankAccount.findMany({
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

// Get bank account by ID
const getBankAccountInfoByIdFromDB = async (id: string) => {
  const numericId = parseInt(id, 10);

  const result = await prisma.bankAccount.findUnique({
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
    throw new ApiError(404, "Bank account information not found");
  }

  return result;
};

// Update a bank account
const updateBankAccountInfoInDB = async (payload: BankAccount, id: string) => {
  const existingBankAccount = await prisma.bankAccount.findUnique({
    where: {
      id: parseInt(id, 10),
    },
  });

  if (!existingBankAccount) {
    throw new ApiError(404, "Bank account information not found");
  }

  const result = await prisma.bankAccount.update({
    where: {
      id: existingBankAccount.id,
    },
    data: {
      routingNumber: payload.routingNumber ?? existingBankAccount.routingNumber,
      accountNumber: payload.accountNumber ?? existingBankAccount.accountNumber,
      accountType: payload.accountType ?? existingBankAccount.accountType,
      updatedAt: new Date(),
    },
  });

  return result;
};

// Delete a bank account (Soft delete)
const deleteBankAccountInfoFromDB = async (id: string) => {
  const numericId = parseInt(id, 10);

  const existingBankAccount = await prisma.bankAccount.findUnique({
    where: {
      id: numericId,
    },
  });

  if (!existingBankAccount) {
    throw new ApiError(404, "Bank account information not found");
  }

  const result = await prisma.bankAccount.delete({
    where: {
      id: numericId,
    },
  });

  return result;
};

export const bankAccountServices = {
  createBankAccountInfoInDB,
  getAllBankAccountInfoFromDB,
  getBankAccountInfoByIdFromDB,
  updateBankAccountInfoInDB,
  deleteBankAccountInfoFromDB,
};
