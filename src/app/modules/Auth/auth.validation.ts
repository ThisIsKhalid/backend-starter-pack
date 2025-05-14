import {z} from "zod";


const userValidationSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8,"Password must be at least 8 characters"),
    name: z.string().optional(),
});

const changePasswordValidationSchema = z.object({
    oldPassword: z.string().min(8),
    newPassword: z.string().min(8),
});

export const authValidation = {
    changePasswordValidationSchema,
    userValidationSchema
}