import { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../../config";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthServices } from "./auth.service";

const verifyUserByOTP = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const result = await AuthServices.verifyUserByOTP(email, otp);

  res.cookie("token", result.accessToken, {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User verified successfully",
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.headers.authorization;

  const result = await AuthServices.refreshToken(refreshToken as string);

  res.cookie("token", result.accessToken, {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Token refreshed successfully",
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await AuthServices.loginUser(email, password);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "You have logged in successfully",
    data: result,
  });
});

// get user profile
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;

  const result = await AuthServices.getMyProfile(user?.email);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "User profile retrieved successfully",
    data: result,
  });
});

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  const result = await AuthServices.forgetPassword(email);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Forget password OTP sent successfully",
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { password } = req.body;
  const user = req.user;

  const result = await AuthServices.resetPassword(user?.email, password);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Password reset successfully",
    data: result,
  });
});

const logOutUser = catchAsync(async (req: Request, res: Response) => {
  const email = req.body.email;

  const result = await AuthServices.logOutUser(email);

  res.clearCookie("token", {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: "none",
  });

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Logged out successfully",
    data: result,
  });
});

export const AuthController = {
  verifyUserByOTP,
  refreshToken,
  loginUser,
  getMyProfile,
  forgetPassword,
  resetPassword,
  logOutUser,
};
