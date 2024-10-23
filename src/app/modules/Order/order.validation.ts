import { z } from "zod";

// Budget schema
const budgetSchema = z.array(
  z.object({
    stepDescription: z.string({
      required_error: "Step description is required",
    }),
    stepCost: z
      .number({
        required_error: "Step cost is required",
      })
      .positive({
        message: "Step cost must be a positive number",
      }),
    helperConfirmation: z.boolean().optional(),
    customerConfirmation: z.boolean().optional(),
  })
);

// Order validation schema
export const orderValidationSchema = z.object({
  body: z.object({
    subject: z.string({
      required_error: "Subject is required",
    }),
    description: z.string({
      required_error: "Description is required",
    }),
    duration: z.string({
      required_error: "Duration is required",
    }),
    timeUnit: z.enum(["hours", "days", "weeks", "months", "years"], {
      required_error: "Time unit is required",
    }),
    serviceLocation: z.string({
      required_error: "Service location is required",
    }),
    city: z.string({
      required_error: "City is required",
    }),
    state: z.string({
      required_error: "State is required",
    }),
    serviceType: z.string({
      required_error: "Service type is required",
    }),
    otherService: z.string().optional(),
    serviceOption: z.enum(["MATERIAL_INCLUDED", "ONLY_LABOR"], {
      required_error: "Service option is required",
    }),
    isPublished: z.boolean().optional(),
    budget: budgetSchema,

    customerId: z
      .number({
        required_error: "Customer ID is required",
      })
      .positive({
        message: "Customer ID must be a positive number",
      })
      .int({
        message: "Customer ID must be an integer",
      }),
  }),
});

export const updateOrderSchema = z.object({
  subject: z.string().optional(),
  description: z.string().optional(),
  duration: z.string().optional(),
  timeUnit: z.enum(["hours", "days", "weeks", "months", "years"]).optional(),
  serviceLocation: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  serviceType: z.string().optional(),
  serviceOption: z.enum(["MATERIAL_INCLUDED", "ONLY_LABOR"]).optional(),
  otherService: z.string().optional(),
  budget: z.array(budgetSchema).optional(),
});
