import { z } from "zod";

// Validation schema for creating a card
const createCardSchema = z.object({
  body: z.object({
    cardHolderName: z
      .string()
      .min(2, "Card holder name must be at least 2 characters long")
      .max(100, "Card holder name must be less than 100 characters"),
    cardNumber: z
      .string()
      .min(16, "Card number must be exactly 16 digits")
      .max(16, "Card number must be exactly 16 digits")
      .regex(/^\d+$/, "Card number must contain only digits"),
    expiryMonth: z
      .string()
      .min(2, "Expiry month must be 2 digits")
      .max(2, "Expiry month must be 2 digits")
      .regex(/^(0[1-9]|1[0-2])$/, "Expiry month must be between 01 and 12"),
    expiryYear: z
      .string()
      .min(4, "Expiry year must be 4 digits")
      .max(4, "Expiry year must be 4 digits")
      .regex(/^\d{4}$/, "Expiry year must contain only digits"),
    cvv: z
      .string()
      .min(3, "CVV must be exactly 3 digits")
      .max(4, "CVV must be 3 or 4 digits")
      .regex(/^\d{3,4}$/, "CVV must contain only digits"),
    zipCode: z
      .string()
      .min(4, "Zip code must be at least 4 characters long")
      .max(10, "Zip code must be less than 10 characters"),
    billingAddress: z
      .string()
      .min(5, "Billing address must be at least 5 characters long")
      .max(200, "Billing address must be less than 200 characters"),
  }),
});

// Validation schema for updating a card
const updateCardSchema = z.object({
  body: z.object({
    cardHolderName: z
      .string()
      .min(2, "Card holder name must be at least 2 characters long")
      .max(100, "Card holder name must be less than 100 characters")
      .optional(),
    cardNumber: z
      .string()
      .min(16, "Card number must be exactly 16 digits")
      .max(16, "Card number must be exactly 16 digits")
      .regex(/^\d+$/, "Card number must contain only digits")
      .optional(),
    expiryMonth: z
      .string()
      .min(2, "Expiry month must be 2 digits")
      .max(2, "Expiry month must be 2 digits")
      .regex(/^(0[1-9]|1[0-2])$/, "Expiry month must be between 01 and 12")
      .optional(),
    expiryYear: z
      .string()
      .min(4, "Expiry year must be 4 digits")
      .max(4, "Expiry year must be 4 digits")
      .regex(/^\d{4}$/, "Expiry year must contain only digits")
      .optional(),
    cvv: z
      .string()
      .min(3, "CVV must be exactly 3 digits")
      .max(4, "CVV must be 3 or 4 digits")
      .regex(/^\d{3,4}$/, "CVV must contain only digits")
      .optional(),
    zipCode: z
      .string()
      .min(4, "Zip code must be at least 4 characters long")
      .max(10, "Zip code must be less than 10 characters")
      .optional(),
    billingAddress: z
      .string()
      .min(5, "Billing address must be at least 5 characters long")
      .max(200, "Billing address must be less than 200 characters")
      .optional(),
  }),
});

// Export the validation schemas
export const CardValidation = {
  createCardSchema,
  updateCardSchema,
};
