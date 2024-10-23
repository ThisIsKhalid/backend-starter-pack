import { Response } from "express";
import httpStatus from "http-status";
import jwt, { Secret } from "jsonwebtoken";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import stripe from "../../../helpars/stripe";
import prisma from "../../../shared/prisma";
import sendResponse from "../../../shared/sendResponse";

// const getStripeAccount = async () => {
//   const stripeAccountId = "";

//   if (!stripeAccountId) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Stripe account not found");
//   }

//   return stripeAccountId;
// };

// const setupStripeAccount = async (data: any) => {
//   const country = "US";

//   const email = "me@keithweaver.ca";

//   const stripeAccount = await stripe.accounts.create({
//     type: "custom",
//     email: email,
//     country: country,
//   });

//   console.log(stripeAccount);
// };

const connectHelper = async (user: { id: string; email: string }) => {
  const accessToken = jwtHelpers.generateToken(
    {
      email: user?.email,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  const stripeConnectUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${config.stripe_client_id}&scope=read_write&state=${accessToken}`;

  return stripeConnectUrl;
};

const handlteOAuthCallback = async (
  authorizationCode: any,
  accessToken: string,
  res: Response
) => {
  try {
    // Decode the access token to get the user ID
    const verifiedUser = jwtHelpers.verifyToken(
      accessToken,
      config.jwt.jwt_secret as Secret
    );

    // Exchange the authorization code for the helper's Stripe account ID
    const tokenResponse = await stripe.oauth.token({
      grant_type: "authorization_code",
      code: authorizationCode as string,
    });

    if (!tokenResponse) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "OAuth Error: Token response is null or undefined"
      );
    }

    // console.log(tokenResponse, userId);

    const { stripe_user_id } = tokenResponse; // Stripe account ID for helper

    // Update the helper's Stripe account ID in the database
    await prisma.helper.update({
      where: { email: verifiedUser.email },
      data: { stripeAccountId: stripe_user_id },
    });

    // Redirect the helper back to their dashboard
    res.redirect(`http://localhost:3000/payment`);
  } catch (error) {
    console.error("OAuth Error: ", error);
    throw new ApiError(httpStatus.BAD_REQUEST, "OAuth Error");
  }
};

const createCheckoutSession = async (
  helperId: number,
  customerEmail: string,
  amount: number
) => {
  try {
    amount = parseFloat(amount.toFixed(2));

    // Retrieve the helper's Stripe account ID from the database
    const helper = await prisma.helper.findUnique({
      where: { id: helperId },
    });

    if (!helper || !helper.stripeAccountId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Helper not found or Stripe account missing"
      );
    }

    // Fetch the helper's Stripe account to verify its status
    // const helperStripeAccount = await stripe.accounts.retrieve(
    //   helper.stripeAccountId
    // );

    // Check if the helper's account is fully verified and able to receive payouts
    // if (
    //   !helperStripeAccount.requirements ||
    //   helperStripeAccount.requirements.disabled_reason ||
    //   helperStripeAccount.charges_enabled === false
    // ) {
    //   throw new ApiError(
    //     httpStatus.BAD_REQUEST,
    //     "Helper's Stripe account is not fully verified or payouts are disabled"
    //   );
    // }

    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: customerEmail, // Optional: pre-fill customer's email
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Service Payment", // Example product name
            },
            unit_amount: amount, // Amount in cents ($10 = 1000)
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        transfer_data: {
          destination: helper.stripeAccountId, // Transfer 70% to the helper's account
        },
        application_fee_amount: Math.round(amount * 0.3), // Admin fee (30% of total amount)
      },
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    });

    if (!session) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Error creating checkout session"
      );
    }

    return session.id;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Error creating checkout session"
    );
  }
};

const verifySession = async (sessionId: string) => {
  try {
    // Fetch the session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // You can check the payment status of the session
    if (session.payment_status === "paid") {
      return {
        paymentStatus: "Payment Successful",
      };
    } else {
      return {
        paymentStatus: "Payment Failed",
      };
    }
  } catch (error) {
    console.error("Error verifying session:", error);
    throw new ApiError(httpStatus.BAD_REQUEST, "Error verifying session");
  }
};

export const paymentService = {
  // getStripeAccount,
  // setupStripeAccount,
  connectHelper,
  handlteOAuthCallback,
  createCheckoutSession,
  verifySession,
};
