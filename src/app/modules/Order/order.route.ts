import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { OrderControllers } from "./order.controller";
import { orderValidationSchema, updateOrderSchema } from "./order.validation";

const router = express.Router();

// Get all orders
router.get(
  "/",
  auth(UserRole.CUSTOMER, UserRole.HELPER),
  OrderControllers.getOrders
);

router.get(
  "/get-orders-by-helper",
  auth(UserRole.HELPER),
  OrderControllers.getOrdersByHelper
);

// Get single order by id
router.get("/:id", OrderControllers.getOrderById);

// Create a new order
router.post(
  "/create-order",
  auth(UserRole.CUSTOMER),
  validateRequest(orderValidationSchema),
  OrderControllers.createOderIntoDB
);

// Update budget confirmation
router.patch(
  "/update-budget-confirmation/:orderId/:budgetId",
  auth(UserRole.CUSTOMER, UserRole.HELPER),
  OrderControllers.updateBudgetConfirmation
);

// Update an order
router.patch(
  "/update/:id",
  auth(UserRole.ADMIN, UserRole.CUSTOMER),
  validateRequest(updateOrderSchema),
  OrderControllers.updateOrder
);

// Update order status
// router.patch(
//   "/update-status/:id",
//   auth(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.HELPER),
//   OrderControllers.updateOrderStatus
// );

// Save or publish order
router.patch(
  "/save-or-publish/:orderId",
  auth(UserRole.CUSTOMER),
  OrderControllers.orderSaveOrPublish
);

// Accept order by helper
router.patch(
  "/accept-order/:orderId",
  auth(UserRole.HELPER),
  OrderControllers.acceptOrderByHelper
);

// Complete order
router.patch(
  "/complete-order/:orderId",
  auth(UserRole.CUSTOMER, UserRole.HELPER),
  OrderControllers.completedOrder
);

// Cancel order by customer
router.delete(
  "/cancel-order/:orderId",
  auth(UserRole.CUSTOMER),
  OrderControllers.cancelOrderByCustomer
);

// Delete an order
router.delete(
  "/delete/:id",
  auth(UserRole.ADMIN),
  OrderControllers.deleteOrder
);

export const orderRoutes = router;
