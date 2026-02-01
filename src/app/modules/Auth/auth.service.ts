import httpStatus from "http-status";
import ApiError from "../../../errors/apiError";
import prisma from "../../../lib/prisma";
import { hashItem } from "../../../utils/hashAndCompareItem";
import { IUser } from "./auth.interface";

const getMe = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  return user;
};

const createUser = async (userData: IUser) => {
  const hashpassword = await hashItem(userData.password);

  const user = await prisma.user.create({
    data: {
      email: userData.email,
      name: userData.name,
      password: hashpassword,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create user");
  }

  return user;
};

export const AuthService = {
  getMe,
  createUser,
  
};
