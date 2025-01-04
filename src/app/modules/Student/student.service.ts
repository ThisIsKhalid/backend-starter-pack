import { UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { v4 as uuidv4 } from "uuid";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

const createStudent = async (payload: any) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new ApiError(400, "This user information already exists");
  }

  await prisma.$transaction(async (TransactionClient) => {
    const hashedPassword: string = await bcrypt.hash(payload.password, 12);

    const studentId =
      payload?.firstName?.slice(0, 1).toUpperCase() +
      payload?.lastName?.slice(0, 1).toUpperCase() +
      uuidv4().slice(0, 6).toUpperCase();

    await TransactionClient.user.create({
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        phoneNumber: payload.phoneNumber,
        email: payload.email,
        password: hashedPassword,
        role: UserRole.STUDENT,
        status: "ACTIVE",
        profileImage: payload.profileImage,
      },
    });

    await TransactionClient.student.create({
      data: {
        studentId: studentId,
        email: payload.email,
        discordUsername: payload.discordUsername,
      },
    });
  });

  return {
    message: "Student information created successfully",
  };
};

const getAllStudents = async () => {
  const students = await prisma.student.findMany({
    include: {
      user: true,
    },
  });

  return students;
};

const getStudentByEmail = async (email: string) => {
  const student = await prisma.student.findUnique({
    where: { email },
    include: {
      user: true,
    },
  });

  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
  }

  return student;
};

const updateStudent = async (email: string, payload: any) => {
  const student = await prisma.student.findUnique({
    where: { email },
  });

  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
  }

  await prisma.$transaction(async (TransactionClient) => {
    await TransactionClient.user.update({
      where: { email },
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        phoneNumber: payload.phoneNumber,
        profileImage: payload.profileImage,
      },
    });

    await TransactionClient.student.update({
      where: { email },
      data: {
        discordUsername: payload.discordUsername,
      },
    });
  });

  return {
    message: "Student information updated successfully",
  };
};

const deleteStudent = async (email: string) => {
  const student = await prisma.student.findUnique({
    where: { email },
  });

  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
  }

  await prisma.$transaction(async (TransactionClient) => {
    await TransactionClient.user.delete({
      where: { email },
    });

    await TransactionClient.student.delete({
      where: { email },
    });
  });

  return {
    message: "Student information deleted successfully",
  };
};

export const StudentService = {
  createStudent,
  getAllStudents,
  getStudentByEmail,
  updateStudent,
  deleteStudent,
};
