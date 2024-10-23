import { UserRole, UserStatus } from "@prisma/client";

export interface IUser {
  id?: string;
  email: string;
  password: string;
  role: UserRole;
  userStatus: UserStatus;
  isDeleted?: boolean;
  profileImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IUserFilterRequest = {
  name?: string | undefined;
  email?: string | undefined;
  contactNumber?: string | undefined;
  searchTerm?: string | undefined;
};

export type ISocialUser = {
  email: string;
  firstName: string;
  lastName?: string;
  profileImage: string;
}
