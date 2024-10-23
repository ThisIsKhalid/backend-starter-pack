import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

import { Request, Response } from "express";
import { customerInfoServices } from "./customer.services";

// Create a new customer
const createCustomerInfo = catchAsync(async (req: Request, res: Response) => {
  const { body, file } = req;
  const bodyData = JSON.parse(body.data);
  const profileImage = file?.path || null;

  const payload = {
    ...bodyData,
    profileImage,
  };

  const result = await customerInfoServices.createCustomerInfoIntoDB(payload);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Customer Created Successfully!",
    data: result,
  });
});

// Get all customers
const getAllCustomerInfo = catchAsync(async (req: Request, res: Response) => {
  const result = await customerInfoServices.getAllCustomerInfoFromDB();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All Customers Retrieved Successfully!",
    data: result,
  });
});

// Get customer by ID
const getCustomerInfoById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await customerInfoServices.getCustomerInfoByIdFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Customer Retrieved Successfully!",
    data: result,
  });
});

// Update a customer
const updateCustomerInfo = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const { body, file } = req;
  const bodyData = JSON.parse(body.data);
  const profileImage = file?.filename
    ? `${process.env.BACKEND_IMAGE_URL}/${file.filename}`
    : null;

  const payload = {
    ...bodyData,
    profileImage,
  };

  const result = await customerInfoServices.updateCustomerInfoInDB(payload, id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Customer Updated Successfully!",
    data: result,
  });
});

// Delete a customer
const deleteCustomerInfo = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const id = req.params.id;

  const result = await customerInfoServices.deleteCustomerInfoFromDB(
    id,
    user.email,
    user.role
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Customer Deleted Successfully!",
    data: result,
  });
});

export const customerController = {
  createCustomerInfo,
  getAllCustomerInfo,
  getCustomerInfoById,
  updateCustomerInfo,
  deleteCustomerInfo,
};
