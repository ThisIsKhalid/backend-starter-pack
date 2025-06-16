import Stripe from "stripe";
import prisma from "../../../shared/prisma";
import stripe from "../stripe";
import emailSender from "../../emailSender/emailSender";



export const paymentIntentSucceeded = async (paymentIntent: Stripe.PaymentIntent) => {
    try {

    }
    catch (e) {

    }
}

export const paymentIntentFailed = async (paymentIntent: Stripe.PaymentIntent) => {
    try {

    }
    catch (e) {

    }
}


export const handleSubscriptionCreated = async (subscription: Stripe.Subscription) => {
    try {
        // const {userId, planId} = subscription.metadata;
        //
        // const isUserSubscriptionExists = await prisma.userSubscription.findUnique({
        //     where: {userId},
        //     include:{
        //         plan: true
        //     }
        // })
        //
        // console.log(isUserSubscriptionExists)
        // if (isUserSubscriptionExists) {
        //     if (isUserSubscriptionExists?.plan?.planName == "FREE") {
        //         await prisma.userSubscription.delete({
        //             where: {userId}
        //         })
        //     }
        // }
        //
        // await prisma.userSubscription.create({
        //     data: {
        //         userId,
        //         planId,
        //         stripeSubId: subscription.id,
        //         status: subscription.status,
        //         currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        //         cancelAtPeriodEnd: subscription.cancel_at_period_end,
        //         canceledAt: subscription.canceled_at
        //             ? new Date(subscription.canceled_at * 1000)
        //             : null
        //     }
        // });
        //
        //
        // console.log(`Subscription created: ${subscription.id}`);
    } catch (error) {
        console.error('Error handling subscription creation:', error);
        throw error;
    }
}

export const handleSubscriptionUpdated = async (subscription: Stripe.Subscription) => {
    try {
        // const {planId, userId} = subscription.metadata;
        //
        // await prisma.userSubscription.update({
        //     // where: {stripeSubId: subscription.id},
        //     where: {userId},
        //     data: {
        //         status: subscription.status,
        //         planId,
        //         cancelAtPeriodEnd: subscription.cancel_at_period_end,
        //         currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        //         shouldDowngradeRole: subscription.cancel_at_period_end,
        //         canceledAt: subscription.canceled_at
        //             ? new Date(subscription.canceled_at * 1000)
        //             : null
        //     }
        // });
        //
        //
        // console.log(`Subscription updated: ${subscription.id}`);
    } catch (error) {
        console.error('Error handling subscription update:', error);
        throw error;
    }
};

export const handleSubscriptionDeleted = async (subscription: Stripe.Subscription) => {
    try {
        // const {userId} = subscription.metadata;
        //
        // await prisma.userSubscription.update({
        //     // where: {stripeSubId: subscription.id},
        //     where: {userId: userId},
        //     data: {
        //         cancelAtPeriodEnd: subscription.cancel_at_period_end,
        //         canceledAt: new Date(),
        //         currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        //         shouldDowngradeRole: subscription.cancel_at_period_end, // Flag for cron job
        //     }
        // });
        //
        //
        // console.log(`Subscription canceled: ${subscription.id}`);
    } catch (error) {
        console.error('Error handling subscription cancellation:', error);
        throw error;
    }
}

export const handleInvoicePaid = async (invoice: Stripe.Invoice) => {
    try {


        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmation</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f6f9fc;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #FF7600;
            background-image: linear-gradient(135deg, #FF7600, #45a049);
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        .content {
            padding: 20px 12px;
            text-align: center;
        }
        .content p {
            font-size: 18px;
            color: #333333;
            margin-bottom: 10px;
        }
        .payment-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .payment-details p {
            margin: 5px 0;
            font-size: 16px;
            color: #555555;
        }
        .payment-details .amount {
            font-size: 24px;
            font-weight: bold;
            color: #FF7600;
            margin: 10px 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
        }
        .footer p {
            font-size: 14px;
            color: #888888;
            margin-bottom: 4px;
        }
        .footer a {
            color: #FF7600;
        }
        .subscription-link {
            margin: 30px 0;
        }
        .subscription-link a {
            display: inline-block;
            text-decoration: none;
            background-color: #FF7600;
            color: white;
            font-size: 16px;
            padding: 12px 30px;
            border-radius: 6px;
            margin: 10px;
        }
        .subscription-link a:hover {
            background-color: #45a049;
        }
        .footer-bottom {
            background-color: #f9f9f9;
            padding: 10px;
            text-align: center;
            font-size: 12px;
            color: #999999;
        }
        .footer-bottom p {
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Received</h1>
        </div>
        <div class="content">
            <p>Hello ,</p>
            <p>We've successfully processed your subscription payment:</p>

            <div class="payment-details">
                <p class="amount">${invoice.currency.toUpperCase()} ${invoice.amount_paid / 100}</p>
                <p>For: ${"subscription.metadata.planName"} Plan</p>
                <p>Invoice #: ${invoice.id}</p>
            </div>

            <p>Your subscription is active until:</p>
            <p><strong>${"new Date(subscription.current_period_end * 1000).toDateString()"}</strong></p>

            <div class="subscription-link">
                <a href="https://oakleaffarmranch.com/manage-subscription">Manage Subscription</a>
            </div>

            <div class="footer">
                <p>Need help? Contact our <a href="mailto:support@yourcompany.com">support team</a></p>
                <p>This is an automated message - please do not reply directly to this email.</p>
            </div>
        </div>
        <div class="footer-bottom">
            <p>© ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;


        // await emailSender("Subscription Renewal Notice", user?.email, html);

        console.log(`Invoice paid: ${invoice.id}`);
    } catch (error) {
        console.error('Error handling invoice.paid:', error);
        throw error;
    }
}

export const handleInvoicePaymentSucceeded = async (invoice: Stripe.Invoice) => {
    try {
        // if (!invoice.subscription) return;
        //
        // const subscription = await stripe.subscriptions.retrieve(
        //     invoice.subscription as string
        // );
        //
        // // Update subscription status
        // await prisma.userSubscription.update({
        //     where: {stripeSubId: subscription.id},
        //     data: {status: subscription.status}
        // });
        //
        // console.log(`Payment succeeded for invoice: ${invoice.id}`);
    } catch (error) {
        console.error('Error handling invoice.payment_succeeded:', error);
        throw error;
    }
}

export const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice) => {
    try {
        // if (!invoice.subscription) return;
        //
        // const subscription = await stripe.subscriptions.retrieve(
        //     invoice.subscription as string
        // );
        //
        // const freePlan = await prisma.subscriptionPlan.findFirst({
        //     where: {planName: "FREE"},
        // })
        //
        // // Update subscription status
        // await prisma.userSubscription.update({
        //     where: {stripeSubId: subscription.id},
        //     data: {status: 'past_due',planId: freePlan?.id, shouldDowngradeRole: true}
        // });
        //
        // console.log(`Payment failed for invoice: ${invoice.id}`);
    } catch (error) {
        console.error('Error handling invoice.payment_failed:', error);
        throw error;
    }
};

export const handleInvoiceUpcoming = async (invoice: Stripe.Invoice) => {
    try {
        // if (!invoice.subscription) return;
        //
        // const subscription = await stripe.subscriptions.retrieve(
        //     invoice.subscription as string
        // );
        //
        // const user = await prisma.user.findUnique({
        //     where: {id: subscription.metadata.userId},
        // });
        //
        // if (!user) throw new Error('User not found');

//         const html = `<!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Subscription Renewal Notice</title>
//     <style>
//         body {
//             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//             background-color: #f6f9fc;
//             margin: 0;
//             padding: 0;
//             line-height: 1.6;
//         }
//         .container {
//             max-width: 600px;
//             margin: 0 auto;
//             background-color: #ffffff;
//             border-radius: 12px;
//             overflow: hidden;
//             box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
//         }
//         .header {
//             background-color: #FF7600;
//             background-image: linear-gradient(135deg, #FF7600, #45a049);
//             padding: 30px 20px;
//             text-align: center;
//         }
//         .header h1 {
//             color: #ffffff;
//             margin: 0;
//             font-size: 28px;
//             font-weight: 600;
//             text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
//         }
//         .content {
//             padding: 20px 12px;
//             text-align: center;
//         }
//         .content p {
//             font-size: 18px;
//             color: #333333;
//             margin-bottom: 10px;
//         }
//         .due-date {
//             font-size: 28px;
//             font-weight: bold;
//             color: #FF7600;
//             margin: 10px 0;
//             padding: 10px 20px;
//             background-color: #f0f8f0;
//             border-radius: 8px;
//             display: inline-block;
//         }
//         .payment-info {
//             font-size: 16px;
//             color: #555555;
//             margin-bottom: 10px;
//         }
//         .payment-amount {
//             font-size: 24px;
//             font-weight: bold;
//             color: #333333;
//             margin: 5px 0;
//         }
//         .cta-button {
//             display: inline-block;
//             text-decoration: none;
//             background-color: #FF7600;
//             color: white;
//             font-size: 18px;
//             font-weight: bold;
//             padding: 12px 24px;
//             border-radius: 6px;
//             margin-top: 20px;
//         }
//         .cta-button:hover {
//             background-color: #45a049;
//         }
//         .footer {
//             margin-top: 40px;
//             padding-top: 20px;
//             border-top: 1px solid #e0e0e0;
//             text-align: center;
//         }
//         .footer p {
//             font-size: 14px;
//             color: #888888;
//             margin-bottom: 4px;
//         }
//         .footer a {
//             color: #FF7600;
//         }
//         .footer-bottom {
//             background-color: #f9f9f9;
//             padding: 10px;
//             text-align: center;
//             font-size: 12px;
//             color: #999999;
//         }
//         .footer-bottom p {
//             margin: 0;
//         }
//     </style>
// </head>
// <body>
//     <div class="container">
//         <div class="header">
//             <h1>Subscription Renewal Notice</h1>
//         </div>
//         <div class="content">
//             <p>Hello ${user.name},</p>
//             <p>Your annual subscription will renew automatically on:</p>
//             <p class="due-date">${invoice.due_date && new Date(invoice.due_date * 1000).toDateString()}</p>
//
//             <p class="payment-info">for the amount of:</p>
//             <p class="payment-amount">${invoice.currency.toUpperCase()} ${invoice.amount_due / 100}</p>
//
//             <p class="payment-info">If you wish to cancel your subscription before the renewal date, please click the button below:</p>
//
//             <a href="https://oakleaffarmranch.com/manage-subscription" class="cta-button">Manage subscription</a>
//
//             <div class="footer">
//                 <p>Thank you for being a valued subscriber!</p>
//                 <p>This is an automated message - please do not reply directly to this email.</p>
//             </div>
//         </div>
//         <div class="footer-bottom">
//             <p>© ${new Date().getFullYear()} Oakleaf. All rights reserved.</p>
//         </div>
//     </div>
// </body>
// </html>`;

        //
        // await emailSender("Subscription Renewal Notice", user?.email, html);
        //
        //
        // console.log(`Upcoming invoice notification sent for subscription: ${subscription.id}`);
    } catch (error) {
        console.error('Error handling invoice.upcoming:', error);
        throw error;
    }
};



