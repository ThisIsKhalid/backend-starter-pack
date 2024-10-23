import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import pick from "../../../shared/pick";
import sendResponse from "../../../shared/sendResponse";
import { orderFilterableFields } from "./order.constant";
import { OrderServices } from "./order.services";

const createOderIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.createOderIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order Created successfully!",
    data: result,
  });
});

const getOrders = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, orderFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const user = req.user;

  const result = await OrderServices.getOrders(user?.email, filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Orders fetched successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getOrdersByHelper = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, orderFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const user = req.user;

  const result = await OrderServices.getOrdersByHelper(
    user.email,
    filters,
    options
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Helper's Orders fetched successfully!",
    data: result,
  });
});

const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);

  const result = await OrderServices.getOrderById(orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order fetched successfully!",
    data: result,
  });
});

const updateOrder = catchAsync(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);
  const data = req.body;

  const result = await OrderServices.updateOrder(orderId, data);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order status updated successfully!",
    data: result,
  });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);
  const status = req.body.status;

  const user = req.user;

  const userData = {
    email: user?.email,
    role: user?.role,
    id: user?.id,
  };

  const result = await OrderServices.updateOrderStatus(
    orderId,
    status,
    userData
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order status updated successfully!",
    data: result,
  });
});

const deleteOrder = catchAsync(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);

  await OrderServices.deleteOrder(orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order deleted successfully!",
    data: null,
  });
});

const updateBudgetConfirmation = catchAsync(
  async (req: Request, res: Response) => {
    const orderId = parseInt(req.params.orderId);
    const budgetId = parseInt(req.params.budgetId);
    const user = req.user;

    const result = await OrderServices.updateBudgetConfirmation(
      orderId,
      budgetId,
      user?.email,
      user?.role
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Budget confirmation updated successfully!",
      data: result,
    });
  }
);

const acceptOrderByHelper = catchAsync(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.orderId);
  const user = req.user;

  const result = await OrderServices.acceptOrderByHelper(orderId, user.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order accepted successfully!",
    data: result,
  });
});

const cancelOrderByCustomer = catchAsync(
  async (req: Request, res: Response) => {
    const orderId = parseInt(req.params.orderId);
    const user = req.user;

    const result = await OrderServices.cancelOrderByCustomer(
      orderId,
      user.email
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Order cancelled successfully!",
      data: result,
    });
  }
);

const completedOrder = catchAsync(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.orderId);

  const result = await OrderServices.completedOrder(orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order completed successfully!",
    data: result,
  });
});

const orderSaveOrPublish = catchAsync(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.orderId);
  const user = req.user;

  const result = await OrderServices.orderSaveOrPublish(orderId, user?.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order saved/published successfully!",
    data: result,
  });
});

export const OrderControllers = {
  createOderIntoDB,
  getOrders,
  getOrdersByHelper,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  updateBudgetConfirmation,
  // status change controller
  acceptOrderByHelper,
  cancelOrderByCustomer,
  completedOrder,
  orderSaveOrPublish,
};
