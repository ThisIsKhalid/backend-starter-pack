/* eslint-disable no-console */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Seed super admin
  const superAdminPassword = await bcrypt.hash("SuperAdmin@123", 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@example.com" },
    update: {},
    create: {
      email: "superadmin@example.com",
      name: "Super Admin",
      password: superAdminPassword,
      role: Role.SUPER_ADMIN,
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log(`✅ Super Admin seeded: ${superAdmin.email}`);

  // Seed admin
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: adminPassword,
      role: Role.ADMIN,
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log(`✅ Admin seeded: ${admin.email}`);

  // Seed regular user
  const userPassword = await bcrypt.hash("User@123", 12);
  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      name: "Regular User",
      password: userPassword,
      role: Role.USER,
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log(`✅ User seeded: ${user.email}`);

  console.log("\n🎉 Seeding complete!");
  console.log("Default credentials:");
  console.log("  superadmin@example.com / SuperAdmin@123");
  console.log("  admin@example.com / Admin@123");
  console.log("  user@example.com / User@123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
