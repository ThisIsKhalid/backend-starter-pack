import { AuthProvider, UserRole, UserStatus } from "@prisma/client";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import emailSender from "../../../helpars/emailSender/emailSender";
import { IPaginationOptions } from "../../../interfaces/paginations";
import prisma from "../../../lib/prisma";
import { otpEmail } from "../../../shared/emails/otpEmail";
import { jwtHelpers } from "../../../utils/jwtHelpers";
import { paginationHelpers } from "../../../utils/paginationHelper";
import { hashPassword } from "../../../utils/passwordHelpers";
import { TDeenUser, TEmployee, TSocialUser } from "./user.interface";

const createDeenUser = async (payload: TDeenUser) => {
  if (!payload?.password) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password is required");
  }

  if (payload?.password.length < 6) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Password must be at least 6 characters long"
    );
  }

  if (!payload.isAcceptedTermsAndPolicy) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must accept the privacy policy to register"
    );
  }

  const isUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (isUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User already exists");
  }

  const hashedPassword = await hashPassword(payload.password);
  const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: hashedPassword,
      isAcceptedTermsAndPolicy: payload.isAcceptedTermsAndPolicy,
      isAgreedToReceiveEmails: payload.isAgreedToReceiveEmails,
      role: UserRole.DEEN_USER,
      otp: randomOtp,
      otpExpiry: otpExpiry,
    },
  });

  const html = otpEmail(randomOtp);

  await emailSender("OTP", user.email, html);

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };
};

const createSocialUser = async (payload: TSocialUser) => {
  const isUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (isUser) {
    if (isUser.status === UserStatus.BLOCKED) {
      throw new ApiError(
        403,
        "Your account is blocked. Please contact support."
      );
    }

    const accessToken = jwtHelpers.generateToken(
      {
        id: isUser.id,
        email: isUser.email,
        role: isUser.role,
      },
      config.jwt.jwt_secret as Secret,
      config.jwt.expires_in as string
    );

    const refreshToken = jwtHelpers.generateToken(
      {
        id: isUser.id,
        email: isUser.email,
        role: isUser.role,
      },
      config.jwt.refresh_token_secret as Secret,
      config.jwt.refresh_token_expires_in as string
    );

    await prisma.user.update({
      where: { id: isUser.id },
      data: {
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: isUser.id,
        firstName: isUser.firstName,
        lastName: isUser.lastName,
        email: isUser.email,
        role: isUser.role,
        image: isUser.image,
      },
    };
  }

  const nameParts = payload.name.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || undefined;

  const user = await prisma.user.create({
    data: {
      firstName: firstName,
      lastName: lastName || "",
      email: payload.email,
      image: payload.image,
      role: UserRole.DEEN_USER,
      isEmailVerified: true,
      authProvider: payload.provider,
      isAcceptedTermsAndPolicy: true,
    },
  });

  const accessToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      image: user.image,
    },
  };
};

const createEmployeeUserAndCompany = async (payload: TEmployee) => {
  if (!payload?.password) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password is required");
  }

  if (payload?.password.length < 6) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Password must be at least 6 characters long"
    );
  }

  if (!payload.isAcceptedTermsAndPolicy) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must accept the privacy policy to register"
    );
  }

  const isUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (isUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User already exists");
  }

  const hashedPassword = await hashPassword(payload.password);
  const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: hashedPassword,
      isAcceptedTermsAndPolicy: payload.isAcceptedTermsAndPolicy,
      isAgreedToReceiveEmails: payload.isAgreedToReceiveEmails,
      role: UserRole.EMPLOYER,
      otp: randomOtp,
      otpExpiry: otpExpiry,
      employers: {
        create: {
          employeePlan: payload.employeePlan,
          telephone: payload.telephone,
          companyProfileURL: payload.companyProfileURL,
          company: {
            create: {
              companyName: payload.companyName,
              country: payload.country,
              city: payload.city,
              companySize: payload.companySize,
            },
          },
        },
      },
    },
  });

  const html = otpEmail(randomOtp);

  await emailSender("OTP", user.email, html);

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };
};

const allUsers = async (
  filters: {
    searchTerm?: string;
  },
  options: IPaginationOptions
) => {
  const { limit, page, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);
  const { searchTerm } = filters;

  const andConditions: any[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { firstName: { contains: searchTerm, mode: "insensitive" } },
        { lastName: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  const whereConditions =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const users = await prisma.user.findMany({
    where: {
      ...whereConditions,
      status: { not: UserStatus.BLOCKED },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      isEmailVerified: true,
      status: true,
    },
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder
        ? { [sortBy]: sortOrder }
        : {
            createdAt: "desc",
          },
  });

  const total = await prisma.user.count({
    where: {
      ...whereConditions,
    },
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: users,
  };
};

const updateStatus = async (userId: string, status: UserStatus) => {
  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User ID is required");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    status: user.status,
  };
};

export const UserService = {
  createDeenUser,
  createSocialUser,
  createEmployeeUserAndCompany,
  allUsers,
  updateStatus,
};
