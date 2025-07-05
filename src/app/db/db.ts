import {UserRole} from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "../../shared/prisma";

export const initiateSuperAdmin = async () => {
    const payload = {
        fullName: "Super Admin",
        phoneNumber: "1234567890",
        email: "superadmin@yopmail.com",
        password: "12345678",
        role: UserRole.SUPER_ADMIN,
    };

    const existingSuperAdmin = await prisma.user.findUnique({
        where: {email: payload.email},
    });

    if (existingSuperAdmin) {
        return;
    }

    await prisma.$transaction(async (TransactionClient) => {
        const hashedPassword: string = await bcrypt.hash(payload.password, 12);


        const admin = await TransactionClient.user.create({
            data: {
                fullName: payload.fullName,
                phoneNumber: payload.phoneNumber,
                email: payload.email,
                password: hashedPassword,
                role: payload.role,
            },
        });

        await TransactionClient.admin.create({
            data: {
                userId: admin.id,
            },
        });
    });
};
