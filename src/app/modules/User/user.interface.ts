import { AuthProvider, Plan } from "@prisma/client";

export type TSocialUser = {
  email: string;
  name: string;
  image: string;
  provider: AuthProvider;
};

export type TDeenUser = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isAcceptedTermsAndPolicy?: boolean;
  isAgreedToReceiveEmails?: boolean;
};


export interface TEmployee extends TDeenUser {
  employeePlan: Plan,
  telephone: string;
  companyProfileURL?: string;
  companyName: string;
  country: string;
  city: string;
  companySize: string;
}