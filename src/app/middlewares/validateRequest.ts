import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

/**
 * Validate the incoming request against a Zod schema and **replace**
 * req.body / req.query / req.params with the sanitised output.
 *
 * Unknown fields are rejected (Zod `.strict()`) and emails are
 * normalised (trim + lowercase) by the schema's transforms.
 */
const validateRequest =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await schema.safeParseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
      cookies: req.cookies,
    });

    if (!result.success) {
      return next(result.error);
    }

    // Assign the parsed (and sanitised) data back to the request.
    // Unknown fields have been stripped by the schema.
    const data = result.data as Record<string, unknown>;
    req.body = data.body ?? {};
    req.query = data.query as typeof req.query;
    req.params = data.params as typeof req.params;

    next();
  };

export const RequestValidation = {
  validateRequest,
};
