import * as bcrypt from "bcrypt";
import config from "../config";
import { number } from "zod";

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = Number(config.password.password_salt);
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};
