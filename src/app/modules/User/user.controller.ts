import { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../../config";
import { paginationFields } from "../../../constants/pagination";
import catchAsync from "../../../shared/catchAsync";
import pick from "../../../shared/pick";
import sendResponse from "../../../shared/sendResponse";
import { UserService } from "./user.service";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createUser(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Check your email for OTP to verify your account",
    data: result,
  });
});

const createSocialUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createSocialUser(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Social user created successfully",
    data: result,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const data = req.body.data ? JSON.parse(req.body.data) : req.body;
  const file = req.file;

  const payload = {
    ...data,
    image: file ? `${config.url.image_url}/${file.filename}` : undefined,
  };

  const result = await UserService.updateUser(payload, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

const allUsers = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, paginationFields);
  const filters = pick(req.query, ["searchTerm"]);

  const result = await UserService.allUsers(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All users retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const status = req.body.status;

  const result = await UserService.updateStatus(userId, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User status updated successfully",
    data: result,
  });
});

export const UserController = {
  createUser,
  createSocialUser,
  updateUser,
  allUsers,
  updateStatus,
};
