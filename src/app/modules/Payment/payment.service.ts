// import { PackageTime, PackageType, SubscriptionStatus } from "@prisma/client";
// import httpStatus from "http-status";
// import Stripe from "stripe";
// import config from "../../../config";
// import ApiError from "../../../errors/ApiErrors";
// import stripe from "../../../helpars/stripe/stripe";
// import prisma from "../../../shared/prisma";

// // Placeholder for sending notifications (e.g., via email or in-app)
// const sendNotification = async (userId: string, message: string) => {
//   // Implement your notification logic here (e.g., email via SendGrid, in-app via database)
//   console.log(`Notification for user ${userId}: ${message}`);
//   // Example: await sendEmail(userId, message);
// };

// const changeSubscriptionPlan = async (
//   packageTime: PackageTime,
//   packageType: PackageType,
//   userId: string
// ) => {
//   // Step 1: Validate the user
//   const isUser = await prisma.user.findUnique({
//     where: { id: userId },
//   });

//   if (!isUser) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found");
//   }

//   if (!isUser.stripeCustomerId) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Stripe customer ID not found");
//   }

//   // Step 2: Check if the user has an existing subscription in your database
//   const existingSubscription = await prisma.subscription.findUnique({
//     where: { userId },
//   });

//   // Step 3: Find the new subscription package
//   const newSubscriptionPackage = await prisma.subscriptionPackage.findFirst({
//     where: {
//       packageTime,
//       packageType,
//     },
//   });

//   if (!newSubscriptionPackage) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Subscription package not found");
//   }

//   // Step 4: Check if the user is trying to switch to the same plan
//   if (
//     existingSubscription &&
//     existingSubscription.packageId === newSubscriptionPackage.id
//   ) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "User is already on this plan");
//   }

//   // Step 5: Handle the subscription change
//   let session: Stripe.Checkout.Session | null = null;
//   let updatedSubscription;

//   if (existingSubscription && existingSubscription.stripeSubscriptionId) {
//     // Case 1: User has an active Stripe subscription, update it
//     const stripeSubscription = await stripe.subscriptions.retrieve(
//       existingSubscription.stripeSubscriptionId
//     );

//     if (
//       stripeSubscription.status === "active" ||
//       stripeSubscription.status === "trialing"
//     ) {
//       // Update the subscription with the new price (plan)
//       const updatedStripeSubscription = await stripe.subscriptions.update(
//         existingSubscription.stripeSubscriptionId,
//         {
//           items: [
//             {
//               id: stripeSubscription.items.data[0].id, // Current subscription item ID
//               price: newSubscriptionPackage.priceId, // New price ID
//             },
//           ],
//           proration_behavior: "create_prorations", // Handle proration (can be 'none' or 'always_invoice')
//           metadata: { email: isUser.email },
//         }
//       );

//       // Update your database with the new plan
//       updatedSubscription = await prisma.subscription.update({
//         where: { userId },
//         data: {
//           packageId: newSubscriptionPackage.id,
//           status: SubscriptionStatus.PENDING,
//           stripeSubscriptionId: updatedStripeSubscription.id,
//         },
//       });
//     } else {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         "Cannot change plan for a non-active subscription"
//       );
//     }
//   } else {
//     // Case 2: No existing Stripe subscription, create a new one
//     session = await stripe.checkout.sessions.create({
//       customer: isUser.stripeCustomerId,
//       line_items: [
//         {
//           price: newSubscriptionPackage.priceId as string,
//           quantity: 1,
//         },
//       ],
//       mode: "subscription",
//       success_url: `${config.url.frontend_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${config.url.frontend_url}/payment/failed?studentId=${isUser.id}`,
//       metadata: { email: isUser.email },
//       client_reference_id: isUser.email,
//     });

//     // Create or update the subscription in your database
//     updatedSubscription = await prisma.subscription.upsert({
//       where: { userId },
//       update: {
//         packageId: newSubscriptionPackage.id,
//         sessionId: session.id,
//         status: SubscriptionStatus.PENDING,
//         stripeSubscriptionId: null, // Set to null initially; update via webhook
//       },
//       create: {
//         userId,
//         packageId: newSubscriptionPackage.id,
//         sessionId: session.id,
//         status: SubscriptionStatus.PENDING,
//         stripeSubscriptionId: null, // Set to null initially; update via webhook
//       },
//     });
//   }

//   await RecentActivityService.createRecentActivity({
//     userId: isUser.id,
//     activityFor: "ADMIN",
//     message: existingSubscription
//       ? `${isUser.email} changed their subscription plan to ${newSubscriptionPackage.packageType} (${newSubscriptionPackage.packageTime}).`
//       : `${isUser.email} created a new subscription plan: ${newSubscriptionPackage.packageType} (${newSubscriptionPackage.packageTime}).`,
//   });

//   return {
//     sessionUrl: session ? session.url : null,
//     subscription: updatedSubscription,
//   };
// };

// // Handle checkout.session.completed
// const handleCheckoutSessionCompleted = async (event: Stripe.Event) => {
//   const session = event.data.object as Stripe.Checkout.Session;
//   const subscriptionId = session.subscription as string;

//   // Find the subscription by sessionId
//   const subscription = await prisma.subscription.findFirst({
//     where: { sessionId: session.id },
//     include: { user: true, subscriptionPackage: true },
//   });

//   if (!subscription) {
//     throw new ApiError(
//       httpStatus.NOT_FOUND,
//       "Subscription not found for session"
//     );
//   }

//   // Update the subscription with stripeSubscriptionId and set status to ACTIVE
//   await prisma.subscription.update({
//     where: { id: subscription.id },
//     data: {
//       stripeSubscriptionId: subscriptionId,
//       status: SubscriptionStatus.ACTIVE,
//       sessionId: null, // Clear sessionId
//     },
//   });

//   await RevenueService.createRevenue(
//     subscription.subscriptionPackage.amount,
//     subscription.userId
//   );

//   // Notify user of successful subscription creation
//   await sendNotification(
//     subscription.userId,
//     `Your subscription has been successfully created!`
//   );
// };

// // Handle customer.subscription.updated
// const handleSubscriptionUpdated = async (event: Stripe.Event) => {
//   const subscription = event.data.object as Stripe.Subscription;

//   // Find the subscription by stripeSubscriptionId
//   const dbSubscription = await prisma.subscription.findFirst({
//     where: { stripeSubscriptionId: subscription.id },
//     include: { user: true, subscriptionPackage: true },
//   });

//   if (!dbSubscription) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Subscription not found");
//   }

//   // Get the new priceId from the subscription items
//   const priceId = subscription.items.data[0]?.price?.id;

//   if (!priceId) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "Price ID not found in subscription"
//     );
//   }

//   // Find the corresponding SubscriptionPackage
//   const subscriptionPackage = await prisma.subscriptionPackage.findFirst({
//     where: { priceId },
//   });

//   if (!subscriptionPackage) {
//     throw new ApiError(
//       httpStatus.NOT_FOUND,
//       "Subscription package not found for price ID"
//     );
//   }

//   // Map Stripe subscription status to your SubscriptionStatus enum
//   let status: SubscriptionStatus;
//   switch (subscription.status) {
//     case "active":
//     case "trialing":
//       status = SubscriptionStatus.ACTIVE;
//       break;
//     case "canceled":
//       status = SubscriptionStatus.CANCELLED;
//       break;
//     case "past_due":
//     case "unpaid":
//       status = SubscriptionStatus.PENDING; // Or PAYMENT_FAILED if added to enum
//       break;
//     default:
//       status = SubscriptionStatus.PENDING;
//   }

//   // Update the subscription in the database
//   await prisma.subscription.update({
//     where: { id: dbSubscription.id },
//     data: {
//       packageId: subscriptionPackage.id,
//       status,
//       stripeSubscriptionId: subscription.id,
//     },
//   });

//   await RevenueService.createRevenue(
//     subscriptionPackage.amount,
//     dbSubscription.userId
//   );

//   // Notify user of subscription update
//   await sendNotification(
//     dbSubscription.userId,
//     `Your subscription plan has been updated to ${subscriptionPackage.packageType} (${subscriptionPackage.packageTime}).`
//   );
// };

// // Handle customer.subscription.deleted
// const handleSubscriptionDeleted = async (event: Stripe.Event) => {
//   const subscription = event.data.object as Stripe.Subscription;

//   // Find the subscription by stripeSubscriptionId
//   const dbSubscription = await prisma.subscription.findFirst({
//     where: { stripeSubscriptionId: subscription.id },
//     include: { user: true },
//   });

//   if (!dbSubscription) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Subscription not found");
//   }

//   // Update the subscription status to CANCELLED
//   await prisma.subscription.update({
//     where: { id: dbSubscription.id },
//     data: {
//       status: SubscriptionStatus.CANCELLED,
//     },
//   });

//   // Notify user of cancellation
//   await sendNotification(
//     dbSubscription.userId,
//     `Your subscription has been canceled.`
//   );
// };

// // Handle invoice.payment_succeeded
// const handlePaymentSucceeded = async (event: Stripe.Event) => {
//   const invoice = event.data.object as Stripe.Invoice;
//   const subscriptionId = invoice.subscription as string;

//   // Find the subscription by stripeSubscriptionId
//   const dbSubscription = await prisma.subscription.findFirst({
//     where: { stripeSubscriptionId: subscriptionId },
//     include: { user: true, subscriptionPackage: true },
//   });

//   if (!dbSubscription) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Subscription not found");
//   }

//   // Ensure subscription is ACTIVE
//   await prisma.subscription.update({
//     where: { id: dbSubscription.id },
//     data: {
//       status: SubscriptionStatus.ACTIVE,
//     },
//   });

//   await RevenueService.createRevenue(
//     dbSubscription.subscriptionPackage.amount,
//     dbSubscription.userId
//   );

//   // Notify user of successful payment
//   await sendNotification(
//     dbSubscription.userId,
//     `Payment of $${(invoice.amount_paid / 100).toFixed(2)} for your ${
//       dbSubscription.subscriptionPackage.packageType
//     } (${
//       dbSubscription.subscriptionPackage.packageTime
//     }) subscription was successful.`
//   );
// };

// // Handle invoice.payment_failed
// const handlePaymentFailed = async (event: Stripe.Event) => {
//   const invoice = event.data.object as Stripe.Invoice;
//   const subscriptionId = invoice.subscription as string;

//   // Find the subscription by stripeSubscriptionId
//   const dbSubscription = await prisma.subscription.findFirst({
//     where: { stripeSubscriptionId: subscriptionId },
//     include: { user: true },
//   });

//   if (!dbSubscription) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Subscription not found");
//   }

//   // Update the subscription status to FAILED
//   await prisma.subscription.update({
//     where: { id: dbSubscription.id },
//     data: {
//       status: SubscriptionStatus.FAILED,
//     },
//   });

//   // Notify user of payment failure
//   await sendNotification(
//     dbSubscription.userId,
//     `Payment for your subscription failed. Please update your payment method.`
//   );
// };

// export const PaymentService = {
//   changeSubscriptionPlan,
//   handleCheckoutSessionCompleted,
//   handleSubscriptionUpdated,
//   handleSubscriptionDeleted,
//   handlePaymentSucceeded,
//   handlePaymentFailed,
// };
