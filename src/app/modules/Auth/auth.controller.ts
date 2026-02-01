import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthService } from "./auth.service";

const getMe = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;

  const result = await AuthService.getMe(user?.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User retrieved successfully",
    data: result,
  });
});

const createUser = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userData = req.body;

    const result = await AuthService.createUser(userData);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User created successfully",
      data: result,
    });
  },
);

export const AuthController = {
  getMe,
  createUser,
};
