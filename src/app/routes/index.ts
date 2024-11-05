import express from "express";

import { AuthRoutes } from "../modules/Auth/auth.routes";
import { StudentRoute } from "../modules/Student/student.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/student",
    route: StudentRoute,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
