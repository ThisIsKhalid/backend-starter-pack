import * as bcrypt from "bcryptjs";
import config from "../config";

export const hashItem = async (item: string): Promise<string> => {
  const saltRounds = Number(config.password_salt || 12);
  return await bcrypt.hash(item, saltRounds);
};

export const compareItem = async (
  item: string,
  hashedItem: string,
): Promise<boolean> => {
  return await bcrypt.compare(item, hashedItem);
};
