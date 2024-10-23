import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { Request, Response } from "express";
import { cardServices } from "./card.service";

// Create a new card
const createCardInfo = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await cardServices.createCardInfoInDB(req.body, user.email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Card Created Successfully!",
    data: result,
  });
});

// Get all cards
const getAllCardInfo = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await cardServices.getAllCardInfoFromDB(user.email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All Cards Retrieved Successfully!",
    data: result,
  });
});

// Get card by ID
const getCardInfoById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await cardServices.getCardInfoByIdFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Card Retrieved Successfully!",
    data: result,
  });
});

// Update a card
const updateCardInfo = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await cardServices.updateCardInfoInDB(req.body, id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Card Updated Successfully!",
    data: result,
  });
});

// Delete a card
const deleteCardInfo = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await cardServices.deleteCardInfoFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Card Deleted Successfully!",
    data: result,
  });
});

export const cardController = {
  createCardInfo,
  getAllCardInfo,
  getCardInfoById,
  updateCardInfo,
  deleteCardInfo,
};
