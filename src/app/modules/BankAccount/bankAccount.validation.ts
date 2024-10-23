import { z } from "zod";

export const AccountTypeEnum = z.enum(["CHECKING", "SAVINGS"]);

// Zod schema for creating a bank account
const createBankAccountSchema = z.object({
  body: z.object({
    routingNumber: z
      .string()
      .length(9, { message: "Routing number must be exactly 9 digits long" }), // Assuming 9 digits for routing numbers
    accountNumber: z
      .string()
      .min(8, { message: "Account number must be at least 8 characters long" }),
    accountType: AccountTypeEnum,
  }),
});

// Zod schema for updating a bank account (optional fields)
const updateBankAccountSchema = z.object({
  body: z.object({
    routingNumber: z
      .string()
      .length(9, { message: "Routing number must be exactly 9 digits long" })
      .optional(),
    accountNumber: z
      .string()
      .min(10, {
        message: "Account number must be at least 10 characters long",
      })
      .optional(),
    accountType: AccountTypeEnum.optional(),
  }),
});

export const BankAccountValidation = {
  createBankAccountSchema,
  updateBankAccountSchema,
};
