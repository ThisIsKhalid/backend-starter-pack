import Stripe from "stripe";

import config from "../../../config";
import stripe from "../stripe";
import {
    handleInvoicePaid,
    handleInvoicePaymentFailed,
    handleInvoicePaymentSucceeded,
    handleInvoiceUpcoming,
    handleSubscriptionCreated,
    handleSubscriptionDeleted,
    handleSubscriptionUpdated, paymentIntentFailed, paymentIntentSucceeded
} from "./databaseUpdate";

const stripeWebhookHandler = async (req: Request, res: Response) => {
    // @ts-ignore
    const sig = req.headers["stripe-signature"] as string;
    let event: any;

    try {

        event = stripe.webhooks.constructEvent(
            req.body as any,
            sig as string,
            config.stripe_webhook_secret as string
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed.`, err.message);
    }

    console.log("✅ event type: " + event.type);

    try {
        const subscription = event.data.object as Stripe.Subscription;
        const invoice = event.data.object as Stripe.Invoice;
        const payment = event.data.object as Stripe.PaymentIntent;
        switch (event.type) {


            case "checkout.session.async_payment_failed":
                await paymentIntentFailed;
                break;

            case "checkout.session.completed":

                await paymentIntentSucceeded
                break;


            case "customer.subscription.created":

                // console.log("subscription: ", subscription)
                await handleSubscriptionCreated(subscription)
                break;


            case "customer.subscription.updated":
                await handleSubscriptionUpdated(subscription)


            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(subscription);
                break;

            case 'invoice.upcoming':
                await handleInvoiceUpcoming(invoice)

            case 'invoice.paid':
                await handleInvoicePaid(invoice)

            case "invoice.payment_succeeded":
                await handleInvoicePaymentSucceeded(invoice);
                break;


            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(invoice);
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error) {
        console.error("Error processing webhook:", error);
    }
};

export const webhookService = {
    stripeWebhookHandler
}