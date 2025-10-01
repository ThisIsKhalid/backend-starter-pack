// import { Request, Response } from "express";
// import httpStatus from "http-status";
// import Stripe from "stripe";
// import config from "../../../config";
// import ApiError from "../../../errors/ApiErrors";
// import stripe from "../../../helpars/stripe/stripe";
// import catchAsync from "../../../shared/catchAsync";
// import sendResponse from "../../../shared/sendResponse";
// import { PaymentService } from "./payment.service";

// const changeSubscriptionPlan = catchAsync(
//   async (req: Request, res: Response) => {
//     const { packageTime, packageType } = req.body;
//     const user = req.user;

//     const result = await PaymentService.changeSubscriptionPlan(
//       packageTime,
//       packageType,
//       user.id
//     );

//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "Subscription plan changed successfully",
//       data: result,
//     });
//   }
// );

// const stripeWebhook = catchAsync(async (req: Request, res: Response) => {
//   const sig = req.headers["stripe-signature"] as string;
//   const webhookSecret = config.stripe.stripe_webhook_secret!;

//   let event: Stripe.Event;

//   try {
//     // Verify the webhook signature
//     event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
//   } catch (err: any) {
//     throw new ApiError(httpStatus.BAD_REQUEST, `Webhook Error: ${err.message}`);
//   }

//   try {
//     switch (event.type) {
//       case "checkout.session.completed":
//         await PaymentService.handleCheckoutSessionCompleted(event);
//         break;
//       case "customer.subscription.updated":
//         await PaymentService.handleSubscriptionUpdated(event);
//         break;
//       case "customer.subscription.deleted":
//         await PaymentService.handleSubscriptionDeleted(event);
//         break;
//       case "invoice.payment_succeeded":
//         await PaymentService.handlePaymentSucceeded(event);
//         break;
//       case "invoice.payment_failed":
//         await PaymentService.handlePaymentFailed(event);
//         break;
//       default:
//         console.log(`Unhandled event type ${event.type}`);
//     }
//   } catch (err: any) {
//     console.error(`Error processing webhook event ${event.type}:`, err.message);
//     return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
//       error: `Webhook processing failed: ${err.message}`,
//     });
//   }

//   // Return a 200 response to acknowledge receipt of the webhook
//   return res.status(httpStatus.OK).json({ received: true });
// });

// export const PaymentController = {
//   stripeWebhook,
//   changeSubscriptionPlan,
// };
