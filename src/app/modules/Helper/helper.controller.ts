import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

import { Request, Response } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { helperInfoServices } from "./helper.services";
import { helperSchema, helperUpdateSchema } from "./helper.validation";

// Create a new helper
const createHelperInfo = catchAsync(async (req: Request, res: Response) => {
  const { files } = req;
  const bodyData = JSON.parse(req.body.data);

  const validationResult = helperSchema.safeParse({ data: bodyData });

  if (!validationResult.success) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Validation Error",
      errors: validationResult.error.errors,
    });
  }

  // Extract the uploaded file paths
  const licenseImage = (files as any)?.licenseImage?.[0]?.path || null;
  const insurenceImage = (files as any)?.insurenceImage?.[0]?.path || null;
  const profileImage = (files as any)?.profileImage?.[0]?.path || null;

  // Convert 'true'/'false' strings to Boolean
  const payload = {
    ...bodyData,
    licenseImage,
    insurenceImage,
    profileImage,
  };

  const result = await helperInfoServices.createHelperInfoIntoDB(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Helper Created Successfully!",
    data: result,
  });
});

// Get all helpers
const getAllHelperInfo = catchAsync(async (req: Request, res: Response) => {
  const result = await helperInfoServices.getAllHelperInfoFromDB();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All Helpers Retrieved Successfully!",
    data: result,
  });
});

// Get helper by ID
const getHelperInfoById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await helperInfoServices.getHelperInfoByIdFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Helper Retrieved Successfully!",
    data: result,
  });
});

// Update a helper
const updateHelperInfo = catchAsync(async (req, res) => {
  const { files } = req;
  const bodyData = JSON.parse(req.body.data);

  
  const validationResult = helperUpdateSchema.safeParse({ data: bodyData });

  if (!validationResult.success) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Validation Error",
      errors: validationResult.error.errors,
    });
  }

  const id = req.params.id;

  // Extract the uploaded file paths
  const licenseImage = (files as any)?.licenseImage?.[0]?.path || null;
  const insurenceImage = (files as any)?.insurenceImage?.[0]?.path || null;
  const profileImage = (files as any)?.profileImage?.[0]?.path || null;

  // Convert 'true'/'false' strings to Boolean
  const payload = {
    ...bodyData,
    profileImage,
    licenseImage,
    insurenceImage,
  };

  const result = await helperInfoServices.updateHelperInfoInDB(payload, id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Helper Updated Successfully!",
    data: result,
  });
});

// Delete a helper
const deleteHelperInfo = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const id = req.params.id;
  const result = await helperInfoServices.deleteHelperInfoFromDB(
    id,
    user.email,
    user.role
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Helper Deleted Successfully!",
    data: result,
  });
});

export const helperController = {
  createHelperInfo,
  getAllHelperInfo,
  getHelperInfoById,
  updateHelperInfo,
  deleteHelperInfo,
};
