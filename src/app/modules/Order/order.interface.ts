import {
  Budget,
  FreeVisit,
  FreeVisitStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ServiceOption,
  TimeUnit,
} from "@prisma/client";

// Order Interface
export interface IOrder {
  id: number;
  orderId: string;

  subject: string;
  description: string;
  duration: string;
  timeUnit: TimeUnit;
  serviceLocation: string;
  city: string;
  state: string;
  serviceType: string;
  otherService?: string;
  serviceOption: ServiceOption;
  isPublished?: boolean;
  budget: Budget[];
  totalCost: number;

  status: OrderStatus;
  freeVisits?: FreeVisit[];

  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;

  customerId: number;
  helperId?: number;
}

export type IOrderFilterRequest = {
  searchTerm?: string;
  serviceType?: string;
  serviceLocation?: string;
  duration?: number;
  timeUnit?: TimeUnit;
  minBudget?: number;
  maxBudget?: number;
  fromDate?: Date;
  toDate?: Date;
};
