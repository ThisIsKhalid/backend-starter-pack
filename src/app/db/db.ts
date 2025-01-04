import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "../../shared/prisma";

export const initiateSuperAdmin = async () => {
  const payload = {
    firstName: "Super",
    lastName: "Admin",
    phoneNumber: "1234567890",
    email: "superadmin@gmail10p.com",
    password: "123456",
    role: UserRole.SUPER_ADMIN,
  };

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingSuperAdmin) {
    return;
  }

  await prisma.$transaction(async (TransactionClient) => {
    const hashedPassword: string = await bcrypt.hash(payload.password, 12);
    const adminId =
      "#" +
      payload?.firstName?.slice(0, 1).toUpperCase() +
      payload?.lastName?.slice(0, 1).toUpperCase() +
      Math.floor(Math.random() * 1000000);

    await TransactionClient.user.create({
      data: {
        firstName: payload.firstName,
        lastName: payload?.lastName,
        phoneNumber: payload.phoneNumber,
        email: payload.email,
        password: hashedPassword,
        role: payload.role,
      },
    });

    await TransactionClient.admin.create({
      data: {
        adminId: adminId,
        email: payload.email,
      },
    });
  });
};
