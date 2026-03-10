import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import multer from "multer";
import { ZodError } from "zod";
import config from "../../config";
import ApiError from "../../errors/apiError";
import handleClientError from "../../errors/handleClientError";
import handleZodError from "../../errors/handleZodError";
import { IGenericErrorMessage } from "../../interfaces/common";
import logger from "../../utils/logger/logger";

const GlobalErrorHandler = (error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong!";
  let errorMessages: IGenericErrorMessage[] = [];

  if (error instanceof PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Validation error in database query.";
    errorMessages = [{ path: "", message: "Prisma validation error" }];
  } else if (error instanceof ZodError) {
    const simplified = handleZodError(error);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorMessages = simplified.errorMessages;
  } else if (error instanceof PrismaClientKnownRequestError) {
    const simplified = handleClientError(error);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorMessages = simplified.errorMessages;
  } else if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errorMessages = error.message ? [{ path: "", message: error.message }] : [];
  } else if (error instanceof TokenExpiredError) {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Your session has expired. Please log in again.";
    errorMessages = [
      {
        path: "token",
        message: `Token expired at ${error.expiredAt.toISOString()}`,
      },
    ];
  } else if (error instanceof JsonWebTokenError) {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Invalid token. Please log in again.";
    errorMessages = [{ path: "token", message: error.message }];
  } else if (error instanceof multer.MulterError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = error.code === "LIMIT_FILE_SIZE" ? "File size is too large." : error.message;
    errorMessages = [{ path: "", message: error.message }];
  } else if (error instanceof PrismaClientInitializationError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "Database initialization error. Please try again later.";
    errorMessages = [{ path: "", message: "Prisma initialization error" }];
  } else if (error instanceof PrismaClientRustPanicError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "A critical database engine error occurred.";
    errorMessages = [{ path: "", message: "Prisma engine panic" }];
  } else if (error instanceof PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "An unknown database error occurred.";
    errorMessages = [{ path: "", message: "Unknown Prisma error" }];
  } else if (error instanceof SyntaxError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Malformed JSON in request body.";
    errorMessages = [{ path: "", message: "Syntax error" }];
  } else if (error instanceof Error) {
    message = error.message || "An unexpected error occurred";
    errorMessages = [{ path: "", message: message }];
  } else {
    message = "An unexpected error occurred.";
    errorMessages = [{ path: "", message }];
  }

  // Log server errors
  if (statusCode >= 500) {
    logger.error({
      message,
      statusCode,
      path: req.originalUrl,
      method: req.method,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    // Only expose stack trace in development
    ...(config.env !== "production" && error instanceof Error ? { stack: error.stack } : {}),
  });
};

export default GlobalErrorHandler;
