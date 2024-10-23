import { FreeVisitStatus, OrderStatus } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { IOrderFreeVisitRequest } from "./orderFreeVisit.interface";

const offerFreeVisit = async (
  orderId: number,
  helperEmail: string,
  payload: IOrderFreeVisitRequest
) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status !== OrderStatus.OPEN) {
    throw new ApiError(400, "Cannot offer free visit for this order");
  }

  const helper = await prisma.helper.findUnique({
    where: {
      email: helperEmail,
    },
  });

  if (!helper) {
    throw new ApiError(404, "Helper not found");
  }

  const isAlreadyOffered = await prisma.freeVisit.findFirst({
    where: {
      orderId: orderId,
      helperId: helper?.helperId,
    },
  });

  if (isAlreadyOffered) {
    throw new ApiError(400, "Free visit already offered");
  }

  const freeVisit = await prisma.freeVisit.create({
    data: {
      orderId: order?.id,
      helperId: helper?.helperId,
      scheduledDate: payload?.scheduledDate,
      shceduledTime: payload?.scheduledTime,
      shortMessage: payload?.shortMessage,
      freeVisitStatus: "OFFERED",
    },
  });

  return freeVisit;
};

const updateFreeVisitStatus = async (
  freeVisitId: number,
  payload: {
    freeVisitStatus: FreeVisitStatus;
    rejectionMessage?: string;
  }
) => {
  const freeVisit = await prisma.freeVisit.findUnique({
    where: {
      id: freeVisitId,
    },
  });

  if (!freeVisit) {
    throw new ApiError(404, "Free visit not found");
  }

  if (freeVisit.freeVisitStatus !== "OFFERED") {
    throw new ApiError(400, "Cannot change status for this free visit");
  }

  const updatedFreeVisit = await prisma.freeVisit.update({
    where: {
      id: freeVisitId,
    },
    data: {
      freeVisitStatus: payload?.freeVisitStatus,
      rejectionMessage: payload?.rejectionMessage,
    },
  });

  return updatedFreeVisit;
};

export const FreeVisitServices = {
  offerFreeVisit,
  updateFreeVisitStatus,
};
