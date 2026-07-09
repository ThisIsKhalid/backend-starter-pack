export interface IUser {
  email: string;
  password: string;
  name: string;
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IRefreshTokenInput {
  refreshToken: string;
}

export interface IForgotPasswordInput {
  email: string;
}

export interface IVerifyOtpInput {
  email: string;
  otp: string;
}

export interface IResetPasswordInput {
  resetToken: string;
  newPassword: string;
}

export interface IVerifyEmailInput {
  email: string;
  otp: string;
}

export interface IResendOtpInput {
  email: string;
  purpose: "EMAIL_VERIFICATION" | "PASSWORD_RESET";
}

export interface IChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}
