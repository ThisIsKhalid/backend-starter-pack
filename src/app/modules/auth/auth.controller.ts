import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthService } from "./auth.service";

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Registration successful. Please check your email to verify your account.",
    data: result,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Login successful.",
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.refreshAccessToken(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Token refreshed successfully.",
    data: result,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const accessToken = req.headers.authorization?.split(" ")[1] ?? "";
  const { refreshToken } = req.body as { refreshToken?: string };
  await AuthService.logout(accessToken, refreshToken);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Logged out successfully.",
    data: null,
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  await AuthService.verifyEmail(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Email verified successfully.",
    data: null,
  });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  await AuthService.resendOtp(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "OTP sent successfully. Please check your email.",
    data: null,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.forgotPassword(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    // Deliberately vague to prevent user enumeration
    message: "If that email exists, a password reset OTP has been sent.",
    data: null,
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.verifyOtp(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "OTP verified successfully. You can now reset your password.",
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.resetPassword(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Password reset successfully. Please log in with your new password.",
    data: null,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.changePassword(req.user.id as string, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Password changed successfully. Please log in again.",
    data: null,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.getMe(req.user.id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Profile retrieved successfully.",
    data: result,
  });
});

export const AuthController = {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  resendOtp,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
  getMe,
};
