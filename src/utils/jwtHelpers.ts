import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";

const generateToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expiresIn: string | boolean
): string => {
  const expiry =
    typeof expiresIn === "string" ? expiresIn : expiresIn ? "30d" : "2h";

  const token = jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn: expiry,
  } as SignOptions);

  return token;
};

const verifyToken = (token: string, secret: Secret) => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelpers = {
  generateToken,
  verifyToken,
};
