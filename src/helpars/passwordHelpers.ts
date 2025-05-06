import * as bcrypt from "bcrypt";
import { number } from "zod";
import config from "../config";

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = Number(config.password.password_salt || 12);
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};
