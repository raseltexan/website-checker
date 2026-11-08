import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import { logActivity } from "../../utils/activity.js";
import { currentUserId } from "../../middlewares/auth.js";
import * as service from "./checkers.service.js";

export const listEnabled = async (_req: Request, res: Response) => {
  sendResponse(res, { data: await service.listEnabledCatalog() });
};

export const listAll = async (_req: Request, res: Response) => {
  sendResponse(res, { data: await service.listFullCatalog() });
};

export const updateCategory = async (req: Request, res: Response) => {
  const category = await service.updateCategory(String(req.params.id), req.body);
  await logActivity({ userId: currentUserId(req), action: "admin.category_updated", entity: "checker_category", entityId: category.id, metadata: req.body });
  sendResponse(res, { message: "Category updated", data: category });
};

export const updateCheck = async (req: Request, res: Response) => {
  const check = await service.updateCheck(String(req.params.id), req.body);
  await logActivity({ userId: currentUserId(req), action: "admin.check_updated", entity: "check", entityId: check.id, metadata: req.body });
  sendResponse(res, { message: "Check updated", data: check });
};
