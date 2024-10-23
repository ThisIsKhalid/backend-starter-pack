import { z } from "zod";

const UserRoleEnum = z.enum(["ADMIN", "SELLER", "BUYER"]);
const UserStatusEnum = z.enum(["ACTIVE", "BLOCKED"]);

const CreateUserValidationSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  username: z.string().min(1),
  mobile: z.string().min(11, "mobile phone number is required 11 DIGIT "),
  password: z.string().nonempty("Password is required"),
});

const UserLoginValidationSchema = z.object({
  body: z.object({
    email: z.string().email().nonempty("Email is required"),
    password: z.string().nonempty("Password is required"),
  }),
});

const userUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  // Add other fields if necessary
});

export const UserValidation = {
  CreateUserValidationSchema,
  UserLoginValidationSchema,
  userUpdateSchema,
};
