import z from "zod";

const createAdminSchema = z.object({
  firstName: z.string({
    required_error: "First name is required.",
  }),
  lastName: z.string({
    required_error: "Last name is required.",
  }),
  phoneNumber: z.string({
    required_error: "Phone number is required.",
  }),
  email: z.string().email({
    message: "Valid email is required.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters long.",
  }),
});

export const AdminValidation = {
  createAdminSchema,
};
