import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

interface Schemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Validates and coerces request parts with Zod. Parsed values replace the originals,
 * so controllers can trust `req.body`, `req.query` and `req.params`.
 * ZodErrors propagate to the global error handler.
 */
export const validate = (schemas: Schemas) => (req: Request, _res: Response, next: NextFunction) => {
  if (schemas.params) req.params = schemas.params.parse(req.params) as Request["params"];
  if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
  if (schemas.query) {
    // Express 5 exposes req.query as a getter, so redefine it with the parsed value.
    Object.defineProperty(req, "query", { value: schemas.query.parse(req.query), writable: true, configurable: true });
  }
  next();
};
