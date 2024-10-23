import bcrypt from "bcrypt";
import prisma from "../../shared/prisma";
import { IAdmin } from "../modules/Admin/admin.interface";

export const initiateSuperAdmin = async () => {
  const payload: IAdmin = {
    firstName: "Super",
    lastName: "Admin",
    phoneNumber: "1234567890",
    email: "khalid.hasan9753@gmail.com",
    password: "123456",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const existingSuperAdmin = await prisma.admin.findUnique({
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
        email: payload.email,
        password: hashedPassword,
        role: "SUPER_ADMIN",
        userStatus: "ACTIVE",
      },
    });

    await TransactionClient.admin.create({
      data: {
        adminId: adminId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        phoneNumber: payload.phoneNumber,
        email: payload.email,
      },
    });
  });
};
