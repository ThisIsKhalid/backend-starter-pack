import {z} from "zod";


const userValidationSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters").optional(),
    fullName: z.string().optional(),
    profileImage: z.string().url().optional(),
    oldPassword: z.string().optional(),
    newPassword: z.string().optional(),
});

const updateProfileSchema = userValidationSchema.partial()

const changePasswordValidationSchema = z.object({
    oldPassword: z.string().min(8),
    newPassword: z.string().min(8),
});

export const authValidation = {
    changePasswordValidationSchema,
    userValidationSchema,
    updateProfileSchema
}

export type IUser = z.infer<typeof userValidationSchema>;