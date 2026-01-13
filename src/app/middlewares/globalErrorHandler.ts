import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { TokenExpiredError } from "jsonwebtoken";
import multer from "multer";
import { ZodError } from "zod";
import config from "../../config";
import handleZodError from "../../errors/handleZodError";
import { IGenericErrorMessage } from "../../interfaces/common";

const GlobalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    console.error("Headers already sent, delegating to default error handler");
    return next(error);
  }

  let statusCode: any = httpStatus.INTERNAL_SERVER_ERROR;
  let message = error.message || "Something went wrong!";
  let errorMessages: IGenericErrorMessage[] = [];

  // handle prisma client validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Prisma Client Validation Error";
    errorMessages = [
      {
        path: "",
        message: error.message,
      },
    ];
  }

  // Handle Zod Validation Errors
  else if (error instanceof ZodError) {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }

  // Handle Prisma Client Known Request Errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const simplifiedError = handleClientError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }

  // Handle Custom ApiError
  else if (error instanceof ApiError) {
    statusCode = error?.statusCode;
    message = error.message;
    errorMessages = error?.message
      ? [
          {
            path: "",
            message: error?.message,
          },
        ]
      : [];
  }

  // Handle Errors
  else if (error instanceof Error) {
    message = error?.message;
    errorMessages = error?.message
      ? [
          {
            path: "",
            message: error?.message,
          },
        ]
      : [];
  }

  // Prisma Client Initialization Error
  else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message =
      "Failed to initialize Prisma Client. Check your database connection or Prisma configuration.";
    errorMessages = [
      {
        path: "",
        message: "Failed to initialize Prisma Client.",
      },
    ];
  }

  // Prisma Client Rust Panic Error
  else if (error instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message =
      "A critical error occurred in the Prisma engine. Please try again later.";
    errorMessages = [
      {
        path: "",
        message: "Prisma Client Rust Panic Error",
      },
    ];
  }

  // Prisma Client Unknown Request Error
  else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "An unknown error occurred while processing the request.";
    errorMessages = [
      {
        path: "",
        message: "Prisma Client Unknown Request Error",
      },
    ];
  }

  if (error instanceof multer.MulterError) {
    statusCode = httpStatus.BAD_REQUEST;

    if (error.code === "LIMIT_FILE_SIZE") {
      message = "File size is too large.";
    } else {
      message = error.message;
    }

    errorMessages = [
      {
        path: "",
        message: error.message,
      },
    ];
  }

  // Prisma Client Known Request Error (Unique Constraint Error)
  // else if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //   if (error.code === "P2002") {
  //     statusCode = httpStatus.CONFLICT;
  //     message = "Unique constraint failed on the database.";
  //     errorMessages = [
  //       {
  //         path: "",
  //         message: "Unique constraint failed on the database.",
  //       },
  //     ];
  //   }
  // }

  // Generic Error Handling (e.g., JavaScript Errors)
  else if (error instanceof SyntaxError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Syntax error in the request. Please verify your input.";
    errorMessages = [
      {
        path: "",
        message: "Syntax Error",
      },
    ];
  } else if (error instanceof TypeError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Type error in the application. Please verify your input.";
    errorMessages = [
      {
        path: "",
        message: "Type Error",
      },
    ];
  } else if (error instanceof ReferenceError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Reference error in the application. Please verify your input.";
    errorMessages = [
      {
        path: "",
        message: "Reference Error",
      },
    ];
  } else if (error instanceof TokenExpiredError) {
    console.log("object");
    statusCode = 401;
    message = "Your session has expired. Please log in again.";
    errorMessages = [
      {
        path: "token",
        message: `Token expired at ${error.expiredAt.toISOString()}`,
      },
    ];
  }
  // Catch any other error type
  else {
    message = "An unexpected error occurred!";
    errorMessages = [
      {
        path: "",
        message: "An unexpected error occurred!",
      },
    ];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    err: error,
    stack: config.env !== "production" ? error?.stack : undefined,
  });
};

export default GlobalErrorHandler;
