import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "../../shared/prisma";

export const initiateSuperAdmin = async () => {
  const payload = {
    firstName: "Super",
    lastName: "Admin",
    email: "superadmin@yopmail.com",
    password: "12345678",
    role: UserRole.ADMIN,
    isVerified: true,
  };

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingSuperAdmin) {
    return;
  }

  await prisma.$transaction(async (TransactionClient) => {
    const hashedPassword: string = await bcrypt.hash(payload.password, 12);

    await TransactionClient.user.create({
      data: {
        firstName: payload.firstName,
        lastName: payload?.lastName,
        email: payload.email,
        password: hashedPassword,
        role: payload.role,
        isVerified: payload.isVerified,
      },
    });
  });
};
