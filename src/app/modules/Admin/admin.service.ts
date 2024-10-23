import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { IAdmin } from "./admin.interface";

const createAdmin = async (payload: IAdmin) => {
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: payload.email },
    include: {
      user: true,
    },
  });

  if (existingAdmin) {
    throw new ApiError(400, "This admin information already exists");
  }

  const result = await prisma.$transaction(async (TransactionClient) => {
    const hashedPassword: string = await bcrypt.hash(payload.password, 12);
    const adminId =
      "#" +
      payload?.firstName?.slice(0, 1).toUpperCase() +
      payload?.lastName?.slice(0, 1).toUpperCase() +
      Math.floor(Math.random() * 1000000);
      
    await TransactionClient.user.create({
      data: {
        email: payload.email,
        password: hashedPassword,
        role: "ADMIN",
        userStatus: "ACTIVE",
        profileImage: payload.profileImage,
      },
    });

    const admin = await TransactionClient.admin.create({
      data: {
        adminId: adminId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        phoneNumber: payload.phoneNumber,
        email: payload.email,
      },
    });

    return admin;
  });

  return result;
};

const getAdminById = async (id: number) => {
  const result = await prisma.admin.findUnique({
    where: {
      id,
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

const updateAdmin = async (id: number, updateData: Partial<IAdmin>) => {
  const result = await prisma.admin.update({
    where: { id },
    data: updateData,
  });

  return result;
};

const deleteAdmin = async (id: number) => {
  const result = await prisma.admin.update({
    where: { id },
    data: { user: { update: { userStatus: "BLOCKED" } } },
    include: {
      user: {
        select: {
          email: true,
          role: true,
          userStatus: true,
        },
      },
    },
  });

  return result;
};

const getAllAdmins = async () => {
  const result = await prisma.admin.findMany({
    where: {
      user: {
        userStatus: "ACTIVE",
      },
    },
    include: {
      user: {
        select: {
          email: true,
          role: true,
          userStatus: true,
        },
      },
    },
  });
  return result;
};

export const AdminService = {
  createAdmin,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  getAllAdmins,
};
