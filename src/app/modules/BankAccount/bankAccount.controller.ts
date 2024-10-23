import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { Request, Response } from "express";
import { bankAccountServices } from "./bankAccount.service";

// Create a new bank account
const createBankAccountInfo = catchAsync(
  async (req: Request, res: Response) => {

    const user = req.user;

    const result = await bankAccountServices.createBankAccountInfoInDB(
      req.body, user.email
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Bank Account Created Successfully!",
      data: result,
    });
  }
);

// Get all bank accounts
const getAllBankAccountInfo = catchAsync(
  async (req: Request, res: Response) => {

    const user = req.user;

    const result = await bankAccountServices.getAllBankAccountInfoFromDB(
      user.email
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All Bank Accounts Retrieved Successfully!",
      data: result,
    });
  }
);

// Get bank account by ID
const getBankAccountInfoById = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await bankAccountServices.getBankAccountInfoByIdFromDB(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Bank Account Retrieved Successfully!",
      data: result,
    });
  }
);

// Update a bank account
const updateBankAccountInfo = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await bankAccountServices.updateBankAccountInfoInDB(
      req.body,
      id
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Bank Account Updated Successfully!",
      data: result,
    });
  }
);

// Delete a bank account
const deleteBankAccountInfo = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await bankAccountServices.deleteBankAccountInfoFromDB(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Bank Account Deleted Successfully!",
      data: result,
    });
  }
);

export const bankAccountController = {
  createBankAccountInfo,
  getAllBankAccountInfo,
  getBankAccountInfoById,
  updateBankAccountInfo,
  deleteBankAccountInfo,
};
