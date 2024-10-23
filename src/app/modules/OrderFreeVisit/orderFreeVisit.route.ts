import { UserRole } from "@prisma/client";
import { Router } from "express";
import auth from "../../middlewares/auth";
import { OrderFreeVisitControllers } from "./orderFreeVisit.controller";

const router = Router();

// Offer a free visit
router.post(
  "/:orderId",
  auth(UserRole.HELPER),
  OrderFreeVisitControllers.offerFreeVisit
);

// Update free visit status
router.patch(
  "/update-status/:freeVisitId",
  auth(UserRole.CUSTOMER),
  OrderFreeVisitControllers.updateFreeVisitStatus
);

export const OrderFreeVisitRoutes = router;
