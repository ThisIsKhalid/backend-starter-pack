import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import {webhookService} from "./webhookService";


const stripeWebhookHandler = catchAsync(async (req: any, res: any) => {
    await webhookService.stripeWebhookHandler(req, res);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subscribed successfully",
        data: null,
    });
});

export const webhookController = {
    stripeWebhookHandler,
}