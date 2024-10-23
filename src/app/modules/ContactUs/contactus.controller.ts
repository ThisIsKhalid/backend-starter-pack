import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { contactUsServices } from "./contactus.services";

const sendEmailFromContactUs = catchAsync(
  async (req: Request, res: Response) => {
    const data = req.body;

    const result = await contactUsServices.sendEmailFromContactUs(data);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Email sent successfully",
      data: result,
    });
  }
);

export const contactUsController = {
  sendEmailFromContactUs,
};
