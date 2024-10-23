import { UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import ApiError from "../../../errors/ApiErrors";
import stripe from "../../../helpars/stripe";
import prisma from "../../../shared/prisma";
import { TCustomerInfo } from "./customer.interface";

const createCustomerInfoIntoDB = async (payload: TCustomerInfo) => {
  const existingCustomer = await prisma.customer.findUnique({
    where: { email: payload.email },
    include: {
      user: true,
    },
  });

  if (existingCustomer?.user?.isDeleted) {
    throw new ApiError(
      400,
      "This customer's account is deleted, please contact support"
    );
  }

  if (existingCustomer) {
    throw new ApiError(400, "This customer information already exists");
  }

  await prisma.$transaction(async (TransactionClient) => {

    const hashedPassword: string = await bcrypt.hash(payload.password, 12);
    const customerId =
      "#" +
      payload?.firstName?.slice(0, 1).toUpperCase() +
      payload?.lastName?.slice(0, 1).toUpperCase() +
      uuidv4().slice(0, 6).toUpperCase();

    await TransactionClient.user.create({
      data: {
        email: payload.email,
        password: hashedPassword,
        role: "CUSTOMER",
        userStatus: "ACTIVE",
        profileImage: payload.profileImage,
      },
    });

    await TransactionClient.customer.create({
      data: {
        customerId: customerId,
        firstName: payload.firstName,
        lastName: payload?.lastName,
        phoneNumber: payload.phoneNumber,
        email: payload.email,
      },
    });
  });

  return {
    message: "Customer information created successfully",
  };
};

const getAllCustomerInfoFromDB = async () => {
  const result = await prisma.customer.findMany({
    where: {
      user: {
        AND: {
          userStatus: "ACTIVE",
          isDeleted: false,
        },
      },
    },
    include: {
      user: {
        select: {
          email: true,
          role: true,
          userStatus: true,
          profileImage: true,
        },
      },
    },
  });
  return result;
};

const getCustomerInfoByIdFromDB = async (id: string) => {
  const numericId = parseInt(id, 10);

  const existingCustomer = await prisma.customer.findUnique({
    where: {
      id: numericId,
    },
    include: {
      user: true,
    },
  });

  if (!existingCustomer) {
    throw new ApiError(404, "Customer information not found");
  }

  if (existingCustomer.user.isDeleted) {
    throw new ApiError(404, "This customer's account is deleted");
  }

  if (existingCustomer.user.userStatus === "BLOCKED") {
    throw new ApiError(404, "This customer's account is blocked");
  }

  const result = await prisma.customer.findUnique({
    where: {
      id: numericId,
    },
    include: {
      user: {
        select: {
          email: true,
          role: true,
          userStatus: true,
          profileImage: true,
        },
      },
    },
  });

  return result;
};

const updateCustomerInfoInDB = async (payload: TCustomerInfo, id: string) => {
  const existingCustomer = await prisma.customer.findUnique({
    where: {
      id: parseInt(id, 10),
    },
    include: {
      user: {
        select: {
          email: true,
          role: true,
          userStatus: true,
          profileImage: true,
        },
      },
    },
  });

  if (!existingCustomer) {
    throw new ApiError(404, "Customer information not found");
  }

  await prisma.$transaction(async (TransactionClient) => {
    await TransactionClient.user.update({
      where: { email: existingCustomer.email },
      data: {
        profileImage:
          payload.profileImage === null
            ? existingCustomer?.user?.profileImage
            : payload.profileImage,
      },
    });

    await TransactionClient.customer.update({
      where: { id: parseInt(id, 10) },
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        phoneNumber: payload.phoneNumber,
        enableTextMessages: payload.enableTextMessages,
        sendEmails: payload.sendEmails,
        enableRealTimeNotification: payload.enableRealTimeNotification,
      },
    });
  });

  return {
    message: "Customer information updated successfully",
  };
};

const deleteCustomerInfoFromDB = async (
  id: string,
  email: string,
  role: UserRole
) => {
  const numericId = parseInt(id, 10);
  const existingCustomer = await prisma.customer.findUnique({
    where: {
      id: numericId,
    },
  });

  if (!existingCustomer) {
    throw new ApiError(404, "Customer information not found");
  }

  if (role === "CUSTOMER" && email !== existingCustomer.email) {
    throw new ApiError(403, "You are not authorized to delete this customer");
  }

  await prisma.customer.update({
    where: { id: numericId },
    data: { user: { update: { isDeleted: true } } },
  });

  return {
    message: "Customer information deleted successfully",
  };
};

export const customerInfoServices = {
  createCustomerInfoIntoDB,
  getAllCustomerInfoFromDB,
  getCustomerInfoByIdFromDB,
  updateCustomerInfoInDB,
  deleteCustomerInfoFromDB,
};
