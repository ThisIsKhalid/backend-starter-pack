import { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../../config";
import { paginationFields } from "../../../constants/pagination";
import catchAsync from "../../../shared/catchAsync";
import pick from "../../../shared/pick";
import sendResponse from "../../../shared/sendResponse";
import { UserService } from "./user.service";

const createDeenUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createDeenUser(req.body);

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
  createDeenUser,
  createSocialUser,
  allUsers,
  updateStatus,
};
