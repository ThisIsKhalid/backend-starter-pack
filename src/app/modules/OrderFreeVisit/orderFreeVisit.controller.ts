import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { FreeVisitServices } from "./orderFreeVisit.services";

const offerFreeVisit = catchAsync(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.orderId);
  const data = req.body;
  const user = req.user;

  const result = await FreeVisitServices.offerFreeVisit(
    orderId,
    user?.email,
    data
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Free visit offered successfully!",
    data: result,
  });
});

const updateFreeVisitStatus = catchAsync(
  async (req: Request, res: Response) => {
    const freeVisitId = parseInt(req.params.freeVisitId);
    const data = req.body;

    const result = await FreeVisitServices.updateFreeVisitStatus(
      freeVisitId,
      data
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Free visit status updated successfully!",
      data: result,
    });
  }
);

export const OrderFreeVisitControllers = {
  offerFreeVisit,
  updateFreeVisitStatus,
};
