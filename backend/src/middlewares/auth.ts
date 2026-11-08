import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";
import { ApiError } from "../utils/ApiError.js";

export type Role = "user" | "admin";

/** Resolves the Better Auth session from cookies and attaches `req.user` / `req.session`. */
export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const result = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!result) throw ApiError.unauthorized();
  if (result.user.banned) throw ApiError.forbidden("Your account has been suspended");
  req.user = result.user;
  req.session = result.session;
  next();
};

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes((req.user.role ?? "user") as Role)) throw ApiError.forbidden();
    next();
  };

export const requireAdmin = [requireAuth, requireRole("admin")];

/** Returns the authenticated user id; only valid after `requireAuth`. */
export const currentUserId = (req: Request) => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
};
