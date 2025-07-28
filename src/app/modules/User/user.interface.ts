export type TSocialUser = {
  email: string;
  name: string;
  image: string;
  provider: string;
};

export type TUser = {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  privacyPolicyAccepted: boolean;

  // update
  phoneNumber?: string;
  dateOfBirth?: Date;
  image?: string;
  address?: string;
};
