import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { IGenericErrorMessage } from "../interfaces/common";

const handleClientError = (error: PrismaClientKnownRequestError) => {
  let errors: IGenericErrorMessage[] = [];
  let message = "";
  const statusCode = 400;

  if (error.code === "P2025") {
    message = (error.meta?.cause as string) || "Record not found!";
    errors = [
      {
        path: "",
        message,
      },
    ];
  } else if (error.code === "P2003") {
    if (error.message.includes("delete()` invocation:")) {
      message = "Delete failed";
      errors = [
        {
          path: "",
          message,
        },
      ];
    }
  } else if (error.code === "P2002") {
    const target = (error.meta?.target as string[]) || [];
    message = `Duplicate value for field: ${target.join(", ")}`;
    errors = [{ path: target.join(", "), message }];
  } else {
    message = error.message || "Something went wrong!";
    errors = [{ path: "", message }];
  }

  return {
    statusCode,
    message,
    errorMessages: errors,
  };
};

export default handleClientError;

//"//\nInvalid `prisma.semesterRegistration.delete()` invocation:\n\n\nAn operation failed because it depends on one or more records that were required but not found. Record to delete does not exist.",
