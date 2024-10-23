import { FreeVisitStatus } from "@prisma/client";

export type IOrderFreeVisitRequest = {
  id: number;
  orderId: number;
  helperId: number;
  scheduledDate: Date;
  scheduledTime: string;
  shortMessage: string;
  rejectionMessage: string;
  freeVisitStatus: FreeVisitStatus;
};
