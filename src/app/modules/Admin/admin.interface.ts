export interface IAdmin {
  id?: number;
  firstName: string;
  lastName?: string;
  password: string;
  phoneNumber: string;
  profileImage?: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
