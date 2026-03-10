import { Response } from "express";

const sendResponse = <T>(
  res: Response,
  jsonData: {
    statusCode: number;
    success: boolean;
    message: string;
    meta?: {
      page: number;
      limit: number;
      total: number;
    };
    data?: T | null;
  }
) => {
  const responseBody: Record<string, unknown> = {
    success: jsonData.success,
    message: jsonData.message,
  };

  if (jsonData.meta !== undefined) {
    responseBody.meta = jsonData.meta;
  }

  // Preserve falsy values (0, false, "") — only exclude undefined
  responseBody.data = jsonData.data !== undefined ? jsonData.data : null;

  res.status(jsonData.statusCode).json(responseBody);
};

export default sendResponse;
