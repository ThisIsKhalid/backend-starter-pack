import Stripe from "stripe";
import config from "../../config";

const stripe = new Stripe(config.stripe_secret_key as string, {
  apiVersion: "2024-12-18.acacia",
});

export default stripe;
