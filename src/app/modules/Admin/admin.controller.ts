import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { AdminService } from "./admin.service";
import sendResponse from "../../../shared/sendResponse";

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const { body, file } = req;
  const bodyData = JSON.parse(body.data);
  const profileImage = file?.path || null;

  const payload = {
    ...bodyData,
    profileImage,
  };
  
  const result = await AdminService.createAdmin(payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Admin created successfully!",
    data: result,
  });
});

const getAdminById = catchAsync(async (req: Request, res: Response) => {
  const adminId = parseInt(req.params.id, 10);
  const result = await AdminService.getAdminById(adminId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin retrieved successfully!",
    data: result,
  });
});

const updateAdmin = catchAsync(async (req: Request, res: Response) => {
  const adminId = parseInt(req.params.id, 10);
  const updateData = req.body;
  const result = await AdminService.updateAdmin(adminId, updateData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin updated successfully!",
    data: result,
  });
});

const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const adminId = parseInt(req.params.id, 10);
  const result = await AdminService.deleteAdmin(adminId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin deleted successfully!",
    data: result,
  });
});

const getAllAdmins = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllAdmins();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All admins retrieved successfully!",
    data: result,
  });
});

export const AdminController = {
  createAdmin,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  getAllAdmins,
};
