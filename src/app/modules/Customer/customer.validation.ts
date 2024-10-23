import z from "zod";

const createCustomerSchema = z.object({
  data: z.object({
    firstName: z.string({
      required_error: "First name is required.",
    }),
    lastName: z.string().optional(),
    phoneNumber: z.string({
      required_error: "Phone number is required.",
    }),
    email: z.string().email({
      message: "Valid email is required.",
    }),
  }),
});

export const CustomerValidation = {
  createCustomerSchema,
};
