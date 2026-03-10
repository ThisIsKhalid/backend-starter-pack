import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";

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

export const jwtHelpers = {
  generateToken,
  verifyToken,
};
