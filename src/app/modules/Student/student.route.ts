import express from "express";
import { StudentController } from "./student.controller";

const router = express.Router();

router.post("/create", StudentController.createCustomerInfo);

router.get("/", StudentController.getAllStudents);

router.get("/single-student", StudentController.getStudentByEmail);

router.put("/update", StudentController.updateStudent);

router.delete("/delete", StudentController.deleteStudent);

export const StudentRoute = router;
