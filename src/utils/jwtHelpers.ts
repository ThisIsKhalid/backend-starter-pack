import jwt, { JwtPayload, Secret } from "jsonwebtoken";

const generateToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expiresIn: string | boolean
): string => {
  let token: string;
  if (typeof expiresIn === "string") {
    token = jwt.sign(payload, secret, {
      algorithm: "HS256",
      expiresIn,
    });
  } else {
    token = jwt.sign(payload, secret, {
      algorithm: "HS256",
      expiresIn: expiresIn ? "30d" : "2h",
    });
  }

  return token;
};

const verifyToken = (token: string, secret: Secret) => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelpers = {
  generateToken,
  verifyToken,
};
