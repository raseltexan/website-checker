import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

export const notFound: RequestHandler = (req, _res, next) => {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`));
};

const normalize = (err: unknown): ApiError => {
  if (err instanceof ApiError) return err;
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    return new ApiError(422, details[0]?.message ?? "Validation failed", details);
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return ApiError.conflict("A record with these details already exists");
    if (err.code === "P2025") return ApiError.notFound("Record");
    if (err.code === "P2023") return ApiError.badRequest("Invalid identifier");
  }
  if (err instanceof Prisma.PrismaClientInitializationError) return ApiError.unavailable("Database is unavailable");
  if (err instanceof SyntaxError && "body" in err) return ApiError.badRequest("Malformed JSON body");
  return new ApiError(500, "Internal server error");
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const apiError = normalize(err);
  if (apiError.statusCode >= 500) console.error(err);
  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    ...(apiError.details ? { errors: apiError.details } : {}),
    ...(!env.isProduction && apiError.statusCode >= 500 && err instanceof Error ? { stack: err.stack } : {}),
  });
};
