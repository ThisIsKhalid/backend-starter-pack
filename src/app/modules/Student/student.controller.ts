import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StudentService } from "./student.service";

const createCustomerInfo = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;

  const result = await StudentService.createStudent(data);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Student information created successfully",
    data: result,
  });
});

const getAllStudents = catchAsync(async (req: Request, res: Response) => {
  const students = await StudentService.getAllStudents();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Students fetched successfully",
    data: students,
  });
});

const getStudentByEmail = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const student = await StudentService.getStudentByEmail(user?.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Student fetched successfully",
    data: student,
  });
});

const updateStudent = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const data = req.body;

  await StudentService.updateStudent(user?.email, data);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Student information updated successfully",
    data: {},
  });
});

const deleteStudent = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;

  await StudentService.deleteStudent(user?.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Student deleted successfully",
    data: {},
  });
});

export const StudentController = {
  createCustomerInfo,
  getAllStudents,
  getStudentByEmail,
  updateStudent,
  deleteStudent,
};
