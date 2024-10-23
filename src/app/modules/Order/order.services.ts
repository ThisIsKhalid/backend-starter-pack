import {
  FreeVisitStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import { paginationHelpers } from "../../../helpars/paginationHelper";
import { IPaginationOptions } from "../../../interfaces/paginations";
import prisma from "../../../shared/prisma";
import { getRandomCharsFromString } from "../../../utils/getRandomCharsFromString";
import { orderFilterableFields, orderSearchableFields } from "./order.constant";
import { IOrder, IOrderFilterRequest } from "./order.interface";

const createOderIntoDB = async (order: IOrder) => {
  const isCustomerExist = await prisma.customer.findUnique({
    where: {
      id: order.customerId,
    },
  });

  if (!isCustomerExist) {
    throw new ApiError(404, "Customer not found");
  }

  const orderId = `${getRandomCharsFromString(
    order.subject,
    2
  )}${new Date().getTime()}`;

  const totalCost = order?.budget?.reduce(
    (acc, current) => acc + Number(current?.stepCost),
    0
  );

  const newOrder = await prisma.order.create({
    data: {
      orderId: orderId,
      subject: order?.subject,
      description: order?.description,
      duration: order?.duration,
      timeUnit: order?.timeUnit,
      serviceLocation: order?.serviceLocation,
      city: order?.city,
      state: order?.state,
      serviceType: order?.serviceType,
      otherService: order?.otherService,
      serviceOption: order?.serviceOption,
      isPublished: order?.isPublished,
      budget: {
        createMany: {
          data: order?.budget.map((b) => ({
            stepDescription: b?.stepDescription,
            stepCost: b?.stepCost,
          })),
        },
      },
      totalCost: totalCost,
      customerId: order?.customerId,
    },
  });

  return newOrder;
};

const getOrders = async (
  email: string,
  filters: IOrderFilterRequest,
  options: IPaginationOptions
) => {
  const { limit, page, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);
  const { searchTerm, minBudget, maxBudget, fromDate, toDate, ...filterData } =
    filters;

  const andConditions = [];

  // search
  if (searchTerm) {
    andConditions.push({
      OR: orderSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
        },
      })),
    });
  }

  // filter
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  // minBudget and maxBudget
  if (minBudget && maxBudget) {
    andConditions.push({
      totalCost: {
        gte: minBudget,
        lte: maxBudget,
      },
    });
  } else if (minBudget) {
    andConditions.push({
      totalCost: {
        gte: minBudget,
      },
    });
  } else if (maxBudget) {
    andConditions.push({
      totalCost: {
        lte: maxBudget,
      },
    });
  }

  // fromDate and toDate
  if (fromDate && toDate) {
    andConditions.push({
      createdAt: {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      },
    });
  } else if (fromDate) {
    andConditions.push({
      createdAt: {
        gte: new Date(fromDate),
      },
    });
  } else if (toDate) {
    andConditions.push({
      createdAt: {
        lte: new Date(toDate),
      },
    });
  }

  const whereConditions: Prisma.OrderWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      customer: true,
      helper: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "Customer not found");
  }

  let id;

  if (user.role === UserRole.CUSTOMER) {
    id = user?.customer?.id;
  } else {
    id = user?.helper?.id;
  }

  const orders = await prisma.order.findMany({
    where: {
      ...whereConditions,
      OR: [
        {
          customerId: id,
        },
        {
          helperId: id,
        },
      ],
    },
    include: {
      budget: true,
      freeVisits: true,
      helper: {
        select: {
          id: true,
          helperId: true,
          firstName: true,
          lastName: true,
          user: {
            select: {
              profileImage: true,
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          customerId: true,
          firstName: true,
          lastName: true,
          user: {
            select: {
              profileImage: true,
            },
          },
        },
      },
    },
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder
        ? {
            [sortBy]: sortOrder,
          }
        : {
            createdAt: "desc",
          },
  });

  const total = await prisma.order.count({
    where: {
      ...whereConditions,
      OR: [
        {
          customerId: id,
        },
        {
          helperId: id,
        },
      ],
    },
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: orders,
  };
};

const getOrdersByHelper = async (
  email: string,
  filters: IOrderFilterRequest,
  options: IPaginationOptions
) => {
  const { limit, page, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);
  const { searchTerm, minBudget, maxBudget, fromDate, toDate, ...filterData } =
    filters;

  const andConditions = [];

  // search
  if (searchTerm) {
    andConditions.push({
      OR: orderSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
        },
      })),
    });
  }

  // filter
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  // minBudget and maxBudget
  if (minBudget && maxBudget) {
    andConditions.push({
      totalCost: {
        gte: minBudget,
        lte: maxBudget,
      },
    });
  } else if (minBudget) {
    andConditions.push({
      totalCost: {
        gte: minBudget,
      },
    });
  } else if (maxBudget) {
    andConditions.push({
      totalCost: {
        lte: maxBudget,
      },
    });
  }

  // fromDate and toDate
  if (fromDate && toDate) {
    andConditions.push({
      createdAt: {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      },
    });
  } else if (fromDate) {
    andConditions.push({
      createdAt: {
        gte: new Date(fromDate),
      },
    });
  } else if (toDate) {
    andConditions.push({
      createdAt: {
        lte: new Date(toDate),
      },
    });
  }

  const whereConditions: Prisma.OrderWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const helper = await prisma.helper.findUnique({
    where: {
      email,
    },
  });

  if (!helper) {
    throw new ApiError(404, "Helper not found");
  }

  const orders = await prisma.order.findMany({
    where: {
      ...whereConditions,
      helperId: helper.id,
    },
    include: {
      budget: true,
      freeVisits: true,
    },
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder
        ? {
            [sortBy]: sortOrder,
          }
        : {
            createdAt: "desc",
          },
  });

  const total = await prisma.order.count({
    where: {
      ...whereConditions,
      helperId: helper.id,
    },
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: orders,
  };
};

const getOrderById = async (orderId: number) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      helper: true,
      customer: true,
      budget: true,
      freeVisits: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return order;
};

const updateOrder = async (orderId: number, data: IOrder) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { budget: true },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (data?.customerId && data?.helperId) {
    throw new ApiError(400, "Cannot change customer or helper");
  }

  if (
    order?.status === OrderStatus.IN_PROGRESS ||
    order?.status === OrderStatus.COMPLETED
  ) {
    throw new ApiError(400, "Cannot update order in progress or completed");
  }

  // Step 1: Get the current budget IDs and provided budget IDs
  const existingBudgetIds = order.budget.map((b) => b.id);
  const providedBudgetIds = data.budget?.filter((b) => b.id).map((b) => b.id);

  let updatedBudget;
  let totalCost;

  if (providedBudgetIds?.length > 0) {
    // Step 2: Delete budget items that are not provided in the update
    const budgetIdsToDelete = existingBudgetIds.filter(
      (id) => !providedBudgetIds.includes(id)
    );

    await prisma.budget.deleteMany({
      where: {
        id: { in: budgetIdsToDelete },
      },
    });

    // Step 3: Prepare updated budget data for upsert
    updatedBudget = data?.budget?.map((b) => ({
      id: b.id || undefined, // If there's no ID, it's a new entry
      stepDescription: b.stepDescription,
      stepCost: b.stepCost,
      helperConfirmation: b.helperConfirmation,
      customerConfirmation: b.customerConfirmation,
    }));

    totalCost = updatedBudget.reduce(
      (acc, current) => acc + Number(current.stepCost),
      0
    );
  }

  // Step 4: Upsert the provided budget items
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      subject: data?.subject,
      description: data?.description,
      duration: data?.duration,
      timeUnit: data?.timeUnit,
      serviceLocation: data?.serviceLocation,
      city: data?.city,
      state: data?.state,
      serviceType: data?.serviceType,
      otherService: data?.otherService,
      serviceOption: data?.serviceOption,
      totalCost: totalCost,
      budget: {
        upsert: updatedBudget?.map((b) => ({
          where: { id: b?.id || -1 },
          update: {
            // Always define the update object
            stepDescription: b?.stepDescription,
            stepCost: b?.stepCost,
            helperConfirmation: b?.helperConfirmation,
            customerConfirmation: b?.customerConfirmation,
          },
          create: {
            // Always create a new entry
            stepDescription: b?.stepDescription,
            stepCost: b?.stepCost,
          },
        })),
      },
    },
  });

  return updatedOrder;
};

const updateOrderStatus = async (
  orderId: number,
  status: OrderStatus,
  user: {
    email: string;
    role: UserRole;
    id: number;
  }
) => {
  // const order = await prisma.order.findUnique({
  //   where: {
  //     id: orderId,
  //   },
  //   include: {
  //     customer: true,
  //     helper: true,
  //   },
  // });
  // if (!order) {
  //   throw new ApiError(404, "Order not found");
  // }
  // if (
  //   status === OrderStatus.CANCELLED &&
  //   order.status === OrderStatus.COMPLETED
  // ) {
  //   throw new ApiError(400, "Cannot cancel a completed order");
  // }
  // if (
  //   status === OrderStatus.IN_PROGRESS &&
  //   order.status === OrderStatus.COMPLETED
  // ) {
  //   throw new ApiError(400, "Cannot change status to in progress");
  // }
  // if (
  //   status === OrderStatus.COMPLETED &&
  //   order.status === OrderStatus.CANCELLED
  // ) {
  //   throw new ApiError(400, "Cannot complete a cancelled order");
  // }
  // if (
  //   user.role === UserRole.CUSTOMER &&
  //   user.email !== order?.customer?.email
  // ) {
  //   throw new ApiError(403, "Unauthorized");
  // }
  // if (
  //   user.role === UserRole.HELPER &&
  //   user.email === order?.helper?.email &&
  //   status === OrderStatus.IN_PROGRESS
  // ) {
  //   await prisma.order.update({
  //     where: {
  //       id: orderId,
  //     },
  //     data: {
  //       helperId: user?.id,
  //     },
  //   });
  // }
  // const updatedOrder = await prisma.order.update({
  //   where: {
  //     id: orderId,
  //   },
  //   data: {
  //     status,
  //   },
  // });
  // return updatedOrder;
};

const deleteOrder = async (orderId: number) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  await prisma.order.delete({
    where: {
      id: orderId,
    },
  });
};

const updateBudgetConfirmation = async (
  orderId: number,
  budgetId: number,
  userEmail: string,
  role: string
) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      budget: true,
      customer: true,
      helper: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const budgetItem = order?.budget.find((b) => b.id === budgetId);

  if (!budgetItem) {
    throw new ApiError(404, "Budget item not found");
  }

  if (budgetItem.helperConfirmation && budgetItem.customerConfirmation) {
    throw new ApiError(400, "Budget item already confirmed");
  }

  if (role === "CUSTOMER" && userEmail !== order.customer.email) {
    throw new ApiError(403, "Unauthorized");
  }

  if (role === "HELPER" && !order.helperId) {
    throw new ApiError(400, "Please ACCEPT the order first");
  }

  if (role === "HELPER" && order.helper && userEmail !== order.helper.email) {
    throw new ApiError(403, "Unauthorized");
  }

  const updatedBudgetItem = await prisma.budget.update({
    where: {
      id: budgetId,
    },
    data: {
      helperConfirmation:
        role === "HELPER" ? true : budgetItem.helperConfirmation,
      customerConfirmation:
        role === "CUSTOMER" ? true : budgetItem.customerConfirmation,
    },
  });

  return updatedBudgetItem;
};

//  order status change: IN_PROGRESS, CANCELLED, COMPLETED
const acceptOrderByHelper = async (orderId: number, helperEmail: string) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      helper: true,
      freeVisits: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.helperId) {
    throw new ApiError(400, "Order already accepted by a helper");
  }

  const helper = await prisma.helper.findUnique({
    where: {
      email: helperEmail,
    },
  });

  if (!helper) {
    throw new ApiError(404, "Helper not found");
  }

  const updatedOrder = await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      helperId: helper.id,
      status: OrderStatus.IN_PROGRESS,
    },
  });

  // Delete all associated FreeVisits after the order is accepted
  await prisma.freeVisit.deleteMany({
    where: {
      orderId: orderId,
    },
  });

  return updatedOrder;
};

const cancelOrderByCustomer = async (
  orderId: number,
  customerEmail: string
) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      customer: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status === OrderStatus.COMPLETED) {
    throw new ApiError(400, "Cannot cancel a completed order");
  }

  if (customerEmail !== order.customer.email) {
    throw new ApiError(403, "Unauthorized");
  }

  await prisma.order.delete({
    where: {
      id: orderId,
    },
  });
};

const completedOrder = async (orderId: number) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status === OrderStatus.COMPLETED) {
    throw new ApiError(400, "Order already completed");
  }

  const budgetItems = await prisma.budget.findMany({
    where: {
      orderId: orderId,
    },
  });

  const allBudgetConfirmed = budgetItems.every(
    (b) => b.helperConfirmation && b.customerConfirmation
  );

  if (!allBudgetConfirmed) {
    throw new ApiError(400, "All budget items must be confirmed");
  }

  const updatedOrder = await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status: OrderStatus.COMPLETED,
    },
  });

  return updatedOrder;
};

const orderSaveOrPublish = async (orderId: number, userEmail: string) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      customer: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (
    order.status === OrderStatus.IN_PROGRESS ||
    order.status === OrderStatus.COMPLETED ||
    order.status === OrderStatus.CANCELLED
  ) {
    throw new ApiError(
      400,
      "Cannot save or publish an order in progress or completed or cancelled"
    );
  }

  if (userEmail !== order.customer.email) {
    throw new ApiError(403, "Unauthorized");
  }

  const result = await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      isPublished: !order.isPublished,
    },
  });

  return result;
};

export const OrderServices = {
  createOderIntoDB,
  getOrders,
  getOrdersByHelper,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  updateBudgetConfirmation,
  // status change service
  acceptOrderByHelper,
  cancelOrderByCustomer,
  completedOrder,
  orderSaveOrPublish,
};
