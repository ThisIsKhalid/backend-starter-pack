import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { TokenExpiredError } from "jsonwebtoken";
import { ZodError } from "zod";
import config from "../../config";
import ApiError from "../../errors/ApiErrors";
import handleClientError from "../../errors/handleClientError";
import handleValidationError from "../../errors/handleValidationError";
import handleZodError from "../../errors/handleZodError";
import parsePrismaValidationError from "../../errors/parsePrismaValidationError";
import { IGenericErrorMessage } from "../../interfaces/error";

const GlobalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode: any = httpStatus.INTERNAL_SERVER_ERROR;
  let message = error.message || "Something went wrong!";
  let errorMessages: IGenericErrorMessage[] = [];

  // handle prisma client validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    const simplifiedError = handleValidationError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
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
  }
  // else if (error instanceof TokenExpiredError) {
  //   statusCode = 401;
  //   message = "Your session has expired. Please log in again.";
  //   errorMessages = [
  //     {
  //       path: "token",
  //       message: `Token expired at ${error.expiredAt.toISOString()}`,
  //     },
  //   ];
  // }
  else if (error?.code === "P2002") {
    // Handle Prisma Duplicate entity error
    statusCode = 409;
    message = `Duplicate entity on the fields: ${error.meta?.target?.join(
      ", "
    )}`;
    errorMessages = [
      {
        path: error.meta?.target?.join(", ") || "",
        message: `Duplicate entity on the fields: ${error.meta?.target}`,
      },
    ];
  } else if (error?.code === "P2003") {
    // Handle Prisma Foreign Key constraint error
    statusCode = 400;
    message = `Foreign key constraint failed on the field: ${error.meta?.field_name}`;
    errorMessages = [
      {
        path: error.meta?.field_name || "",
        message: `Foreign key constraint failed on the field: ${error.meta?.field_name} in model ${error.meta?.modelName}`,
      },
    ];
  } else if (error?.code === "P2011") {
    // Handle Prisma Null constraint violation error
    statusCode = 400;
    message = `Null constraint violation on the field: ${error.meta?.field_name}`;
    errorMessages = [
      {
        path: error.meta?.field_name || "",
        message: `Null constraint violation on the field: ${error.meta?.field_name}`,
      },
    ];
  } else if (error?.code === "P2025") {
    // Handle Prisma Record not found error
    statusCode = 404;
    message = `Record not found for the model: ${error.meta?.model}`;
    errorMessages = [
      {
        path: error.meta?.cause,
        message: `${
          error.meta?.cause ||
          "No matching record found for the given criteria."
        }`,
      },
    ];
  }

  // Handle Errors
  else if (error instanceof Error) {
    if (error.name === "TokenExpiredError") {
      statusCode = 401;
      message = "Your session has expired. Please log in again.";
      errorMessages = [
        {
          path: "token",
          message:
            error && "expiredAt" in error && error.expiredAt
              ? `Token expired at ${new Date(
                  (error as any).expiredAt
                ).toISOString()}`
              : "Token has expired.",
        },
      ];
    }

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
