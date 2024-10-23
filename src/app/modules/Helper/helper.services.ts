import { UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import ApiError from "../../../errors/ApiErrors";
import stripe from "../../../helpars/stripe";
import prisma from "../../../shared/prisma";
import { THelperInfo } from "./helper.interface";

const createHelperInfoIntoDB = async (payload: THelperInfo) => {
  // Check if a user already exists with the given email
  const existingUser = await prisma.helper.findUnique({
    where: {
      email: payload.email,
    },
    include: {
      user: true,
    },
  });

  if (existingUser?.user?.isDeleted) {
    throw new ApiError(
      400,
      "This helper's account is deleted, please contact support"
    );
  }

  if (existingUser) {
    throw new ApiError(400, "User already exists with this email");
  }

  await prisma.$transaction(async (transactionClient) => {

    const hashedPassword: string = await bcrypt.hash(payload?.password, 12);
    const helperId =
      "#" +
      payload?.firstName?.slice(0, 1).toUpperCase() +
      payload?.lastName?.slice(0, 1).toUpperCase() +
      uuidv4().slice(0, 6).toUpperCase();

    await transactionClient.user.create({
      data: {
        email: payload?.email,
        password: hashedPassword,
        role: "HELPER",
        userStatus: "ACTIVE",
        profileImage: payload?.profileImage,
      },
    });

    await transactionClient.helper.create({
      data: {
        helperId: helperId,
        firstName: payload?.firstName,
        lastName: payload?.lastName,
        checkType: payload?.checkType,
        ssnId: payload?.ssnId,
        businessLegalName: payload?.businessLegalName,
        einTexId: payload?.einTexId,
        email: payload?.email,
        phoneNumber: payload?.phoneNumber,
        address: payload?.address,
        apartment: payload?.apartment,
        city: payload?.city,
        state: payload?.state,
        zipCode: payload?.zipCode,
        serviceLocation: payload?.serviceLocation,
        serviceType: payload?.serviceType,
        licenseImage: payload?.licenseImage,
        insurenceImage: payload?.insurenceImage,
      },
    });
  });

  return {
    message: "Helper information created successfully",
  };
};

const getAllHelperInfoFromDB = async () => {
  const result = await prisma.helper.findMany({
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

const getHelperInfoByIdFromDB = async (id: string) => {
  // Check if the helper info exists
  const existingHelper = await prisma.helper.findFirst({
    where: {
      id: parseInt(id, 10),
    },
    include: {
      user: true,
    },
  });

  if (!existingHelper) {
    throw new ApiError(400, "Helper information not found");
  }

  if (existingHelper.user.isDeleted) {
    throw new ApiError(400, "This helper is deleted");
  }

  if (existingHelper.user.userStatus === "BLOCKED") {
    throw new ApiError(400, "This helper is blocked");
  }

  const result = await prisma.helper.findUnique({
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
  return result;
};

const updateHelperInfoInDB = async (payload: THelperInfo, id: string) => {
  const numericId = parseInt(id, 10);

  const existingHelper = await prisma.helper.findUnique({
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

  if (!existingHelper) {
    throw new ApiError(404, "Helper information not found");
  }

  await prisma.$transaction(async (TransactionClient) => {
    const { profileImage, ...data } = payload;

    await TransactionClient.user.update({
      where: { email: existingHelper.email },
      data: {
        profileImage:
          profileImage === null
            ? existingHelper.user?.profileImage
            : profileImage,
      },
    });

    await TransactionClient.helper.update({
      where: { id: numericId },
      data: {
        ...data,
        licenseImage:
          payload.licenseImage === null
            ? existingHelper.licenseImage
            : payload.licenseImage,
        insurenceImage:
          payload.insurenceImage === null
            ? existingHelper.insurenceImage
            : payload.insurenceImage,
      },
    });
  });

  return {
    message: "Helper information updated successfully",
  };
};

const deleteHelperInfoFromDB = async (
  id: string,
  email: string,
  role: UserRole
) => {
  const numericId = parseInt(id, 10);

  const existingHelper = await prisma.helper.findUnique({
    where: {
      id: numericId,
    },
    include: {
      user: true,
    },
  });

  if (!existingHelper) {
    throw new ApiError(404, "Helper information not found");
  }

  if (existingHelper?.user.isDeleted) {
    throw new ApiError(400, "This helper is already deleted");
  }

  if (role === "HELPER" && email !== existingHelper.user.email) {
    throw new ApiError(401, "You are not authorized to delete this helper");
  }

  await prisma.helper.update({
    where: { id: numericId },
    data: { user: { update: { isDeleted: true } } },
  });

  return {
    message: "Helper deleted successfully",
  };
};

export const helperInfoServices = {
  createHelperInfoIntoDB,
  getAllHelperInfoFromDB,
  getHelperInfoByIdFromDB,
  updateHelperInfoInDB,
  deleteHelperInfoFromDB,
};
