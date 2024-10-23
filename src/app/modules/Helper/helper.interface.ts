import { CheckType, UserStatus } from "@prisma/client";

export interface THelperInfo {
  id: number;
  email: string;
  password: string;
  role: "HELPER";
  userStatus: UserStatus;
  profileImage?: string;
  isDeleted: boolean;
  otp?: string;
  otpExpiry?: Date;
  identifier?: string;

  // Helper model fields
  helperId: string;
  firstName: string;
  lastName?: string;
  checkType: CheckType;
  ssnId?: string;
  businessLegalName?: string;
  einTexId?: string;
  phoneNumber: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  serviceLocation: string;
  serviceType: string;
  licenseImage?: string;
  insurenceImage?: string;
  enableTextMessages: boolean;
  sendEmails: boolean;
  enableRealTimeNotification: boolean;
  totalEarnings: number;

  createdAt: Date;
  updatedAt: Date;
}
