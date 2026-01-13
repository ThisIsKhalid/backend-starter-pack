import { ZodError } from "zod";
import {
  IGenericErrorMessage,
  IGenericErrorResponse,
} from "../interfaces/common";

const handleZodError = (error: ZodError): IGenericErrorResponse => {
  const errors: IGenericErrorMessage[] = error.issues.map((issue) => {
    const lastPath = issue?.path[issue.path.length - 1];
    return {
      path:
        typeof lastPath === "symbol"
          ? lastPath.toString()
          : lastPath ?? "unknown",
      message: issue?.message,
    };
  });

  const statusCode = 400;

  return {
    statusCode,
    message: "Validation Error",
    errorMessages: errors,
  };
};

export default handleZodError;
