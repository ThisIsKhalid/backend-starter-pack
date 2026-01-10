import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  //   {
  //     path: "/order",
  //     route: OrderRoutes,
  //   },
];

moduleRoutes.forEach((r) => router.use(r.path, r.route));

export default router;
