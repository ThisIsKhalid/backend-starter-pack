import bcrypt from "bcrypt";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../../config";
import { otpEmail } from "../../../emails/otpEmail";
import ApiError from "../../../errors/ApiErrors";
import emailSender from "../../../helpars/emailSender/emailSender";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import {
  comparePassword,
  hashPassword,
} from "../../../helpars/passwordHelpers";
import prisma from "../../../shared/prisma";

const verifyUserByOTP = async (email: string, otp: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.otp !== otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "OTP expired");
  }

  await prisma.user.update({
    where: {
      email: user.email,
    },
    data: {
      isVerified: true,
      otp: null,
      otpExpiresAt: null,
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
    where: {
      email: user.email,
    },
    data: {
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
  });

  return {
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (refreshToken: string) => {
  const decodedToken = jwtHelpers.verifyToken(
    refreshToken,
    config.jwt.refresh_token_secret as Secret
  );

  if (!decodedToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: decodedToken.email,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.refreshToken !== refreshToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
  }

  const accessToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  await prisma.user.update({
    where: {
      email: user.email,
    },
    data: {
      accessToken: accessToken,
    },
  });

  return { accessToken };
};

const loginUser = async (
  email: string,
  password: string,
  keepMeLogin?: boolean
) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: email,
    },
  });

  if (!userData) {
    throw new ApiError(404, "User not found");
  }

  if (!password || !userData?.password) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password is required");
  }

  const isCorrectPassword: boolean = await comparePassword(
    password,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new ApiError(401, "Password is incorrect");
  }

  if (userData?.isVerified === false) {
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: {
        id: userData.id,
      },
      data: {
        otp: randomOtp,
        otpExpiresAt: otpExpiry,
      },
    });

    const html = otpEmail(randomOtp);

    await emailSender("OTP", userData.email, html);

    return {
      id: userData.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role,
    };
  } else {
    const accessToken = jwtHelpers.generateToken(
      {
        id: userData.id,
        email: userData.email,
        role: userData.role,
      },
      config.jwt.jwt_secret as Secret,
      config.jwt.expires_in as string
    );

    // const accessToken = jwtHelpers.generateToken(
    //   {
    //     id: userData.id,
    //     email: userData.email,
    //     role: userData.role,
    //   },
    //   config.jwt.jwt_secret as Secret,
    //   keepMeLogin as boolean,
    // );

    const refreshToken = jwtHelpers.generateToken(
      {
        id: userData.id,
        email: userData.email,
        role: userData.role,
      },
      config.jwt.refresh_token_secret as Secret,
      config.jwt.refresh_token_expires_in as string
    );

    await prisma.user.update({
      where: {
        email: userData.email,
      },
      data: {
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
};

// get user profile
const getMyProfile = async (email: string) => {
  if (!email) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
  }

  const userProfile = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isVerified: true,
    },
  });

  if (!userProfile) {
    throw new ApiError(404, "User not found");
  }

  return userProfile;
};

const forgetPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      otp: randomOtp,
      otpExpiresAt: otpExpiry,
    },
  });

  const html = otpEmail(randomOtp);

  await emailSender("OTP", user.email, html);
};

const resetPassword = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const hashedPassword = await hashPassword(password);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
      otp: null,
      otpExpiresAt: null,
    },
  });
};

const logOutUser = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      accessToken: null,
      refreshToken: null,
    },
  });
};

export const AuthServices = {
  verifyUserByOTP,
  refreshToken,
  loginUser,
  logOutUser,
  getMyProfile,
  forgetPassword,
  resetPassword,
};

/*

* Login Flow
1. User requests to login
2. If user is not verified, generate OTP and send email
3. If user is verified, generate access and refresh token and send them to the user

* OTP Flow
1. User requests to verify OTP
2. If OTP is valid, update user to verified and generate access and refresh token
3. If OTP is invalid, return error

* Forget Password Flow
1. User requests to forget password
2. Generate OTP and send email
3. Verify OTP, if valid, generate access and refresh token and save them to the user table
4. save token and set password and login


*/
