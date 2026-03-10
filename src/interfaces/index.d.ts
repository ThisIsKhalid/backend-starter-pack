import { Role } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload & {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}
