import crypto from "crypto";

export const generateOTP = (): string => {
  // crypto.randomInt is cryptographically secure; Math.random is not.
  return crypto.randomInt(100000, 999999).toString();
};
