import { z } from "zod";

export const helperSchema = z.object({
  data: z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    firstName: z
      .string()
      .min(2, "First name is required, and must be at least 2 characters long"),
    lastName: z.string().optional(),
    checkType: z.enum(["individual", "business"]),
    ssnId: z.string().optional(),
    businessLegalName: z.string().optional(),
    einTexId: z.string().optional(),
    phoneNumber: z
      .string()
      .min(8, "Phone number must be valid, and at least 8 characters long"),
    address: z
      .string()
      .min(3, "Address is required, and must be at least 3 characters long"),
    apartment: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(2, "State is required"),
    zipCode: z.string().min(5, "Zip code must be at least 5 characters"),
    serviceLocation: z.string().min(1, "Service location is required"),
    serviceType: z.string().min(1, "Service type is required"),
  }),
});

export const helperUpdateSchema = z.object({
  data: z.object({
    firstName: z
      .string()
      .min(2, "First name is required, and must be at least 2 characters long")
      .optional(),
    lastName: z.string().optional(),
    phoneNumber: z
      .string()
      .min(8, "Phone number must be valid, and at least 8 characters long")
      .optional(),
    address: z
      .string()
      .min(3, "Address is required, and must be at least 3 characters long")
      .optional(),
    apartment: z.string().optional(),
    city: z.string().min(1, "City is required").optional(),
    state: z.string().min(2, "State is required").optional(),
    zipCode: z
      .string()
      .min(5, "Zip code must be at least 5 characters")
      .optional(),
    serviceLocation: z
      .string()
      .min(1, "Service location is required")
      .optional(),
    serviceType: z.string().min(1, "Service type is required").optional(),
    enableTextMessages: z.boolean().optional(),
    sendEmails: z.boolean().optional(),
    enableRealTimeNotification: z.boolean().optional(),
  }),
});
