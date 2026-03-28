import { Role } from "@prisma/client";
import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import config from "../config";

const generateToken = (
  payload: string | object | Buffer,
  secret: Secret,
  expiresIn: string | number | undefined
): string => {
  const token = jwt.sign(payload, secret, {
    algorithm: "HS256",
    ...(expiresIn && {
      expiresIn: expiresIn as SignOptions["expiresIn"],
    }),
  });

  return token;
};

const verifyToken = (token: string, secret: Secret) => {
  return jwt.verify(token, secret) as JwtPayload;
};

export interface ITokenPayload {
  id: string;
  email: string;
  role: Role;
}

const generateAuthTokens = (payload: ITokenPayload) => {
  const accessToken = jwtHelpers.generateToken(payload, config.jwt.secret, config.jwt.expiresIn);
  const refreshToken = jwtHelpers.generateToken(
    payload,
    config.jwt.refreshSecret,
    config.jwt.refreshExpiresIn
  );
  return { accessToken, refreshToken };
};

export const jwtHelpers = {
  generateToken,
  verifyToken,
  generateAuthTokens,
};
