import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import config from "../../config";
import ApiError from "../../errors/apiError";
import prisma from "../../lib/prisma";
import { isTokenBlacklisted } from "../../lib/redisConnection";
import { jwtHelpers } from "../../utils/jwtHelpers";

const auth = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "No token provided. Please log in.");
      }

      const token = authHeader.split(" ")[1];

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token format.");
      }

      // Check if token is blacklisted (logged out)
      const blacklisted = await isTokenBlacklisted(token);
      if (blacklisted) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "Token has been invalidated. Please log in again."
        );
      }

      let decoded;
      try {
        decoded = jwtHelpers.verifyToken(token, config.jwt.secret);
      } catch (err) {
        if (err instanceof TokenExpiredError) {
          throw new ApiError(
            httpStatus.UNAUTHORIZED,
            "Your session has expired. Please log in again."
          );
        }
        if (err instanceof JsonWebTokenError) {
          throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token. Please log in again.");
        }
        throw err;
      }

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, isActive: true },
      });

      if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User no longer exists.");
      }

      if (!user.isActive) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "Your account has been deactivated. Please contact support."
        );
      }

      // Role-based access control
      if (roles.length > 0 && !roles.includes(user.role)) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "You do not have permission to access this resource."
        );
      }

      req.user = decoded as typeof req.user;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
