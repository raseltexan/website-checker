import type { NextFunction, Request, Response } from "express";
import { getSetting } from "../modules/settings/settings.service.js";
import { ApiError } from "../utils/ApiError.js";

/** Blocks non-admin API usage while maintenance mode is enabled. Must run after requireAuth. */
export const maintenanceGuard = async (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role === "admin") return next();
  const { maintenanceMode } = await getSetting("general");
  if (maintenanceMode) throw ApiError.unavailable("The platform is under maintenance. Please try again later.");
  next();
};
