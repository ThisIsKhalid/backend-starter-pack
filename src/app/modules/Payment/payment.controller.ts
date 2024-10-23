import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

import { Request, Response } from "express";
import ApiError from "../../../errors/ApiErrors";
import { paymentService } from "./payment.service";

// const getStripeAccount = catchAsync(async (req: Request, res: Response) => {
//   const result = await paymentService.getStripeAccount();

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Stripe account retrieved successfully",
//     data: result,
//   });
// });

// const setupStripeAccount = catchAsync(async (req: Request, res: Response) => {
//   const data = req.body;

//   const result = await paymentService.setupStripeAccount(data);

//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     success: true,
//     message: "Stripe account setup successfully",
//     data: result,
//   });
// });

const connectHelper = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;

  const userDetails = {
    id: user.id,
    email: user.email,
  };

  const result = await paymentService.connectHelper(userDetails);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stripe account setup successfully",
    data: result,
  });
});

const handlteOAuthCallback = catchAsync(async (req: Request, res: Response) => {
  const authorizationCode = req.query.code;
  const accessToken = req.query.state;

  // console.log(authorizationCode, accessToken);

  if (!authorizationCode || !accessToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OAuth callback");
  }

  await paymentService.handlteOAuthCallback(
    authorizationCode,
    accessToken as string,
    res
  );
});

const createCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const { helperId, customerEmail, amount } = req.body;

    const result = await paymentService.createCheckoutSession(
      helperId,
      customerEmail,
      amount
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Checkout session created successfully",
      data: result,
    });
  }
);

const verifySession = async (req: Request, res: Response) => {
  const sessionId = req.query.session_id as string;

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required" });
  }

  const session = await paymentService.verifySession(sessionId);

  res.json(session);
};

export { verifySession };

export const paymentController = {
  // getStripeAccount,
  // setupStripeAccount,
  connectHelper,
  handlteOAuthCallback,
  createCheckoutSession,
  verifySession,
};
