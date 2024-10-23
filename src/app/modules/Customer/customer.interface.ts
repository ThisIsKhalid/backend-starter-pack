import { UserStatus } from "@prisma/client";

export interface TCustomerInfo {
  id: number;
  email: string;
  password: string;
  role: "CUSTOMER";
  userStatus: UserStatus;
  profileImage?: string;

  customerId: string;
  firstName: string;
  lastName?: string;
  phoneNumber: string;

  enableTextMessages?: boolean;
  sendEmails?: boolean;
  enableRealTimeNotification?: boolean;

  createdAt: Date;
  updatedAt: Date;
}
