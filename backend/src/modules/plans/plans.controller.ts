import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import { logActivity } from "../../utils/activity.js";
import { currentUserId } from "../../middlewares/auth.js";
import * as service from "./plans.service.js";

export const listActive = async (_req: Request, res: Response) => {
  sendResponse(res, { data: await service.listActivePlans() });
};

export const listAll = async (_req: Request, res: Response) => {
  sendResponse(res, { data: await service.listAllPlans() });
};

export const create = async (req: Request, res: Response) => {
  const plan = await service.createPlan(req.body);
  await logActivity({ userId: currentUserId(req), action: "admin.plan_created", entity: "plan", entityId: plan.id });
  sendResponse(res, { statusCode: 201, message: "Plan created", data: plan });
};

export const update = async (req: Request, res: Response) => {
  const plan = await service.updatePlan(String(req.params.id), req.body);
  await logActivity({ userId: currentUserId(req), action: "admin.plan_updated", entity: "plan", entityId: plan.id });
  sendResponse(res, { message: "Plan updated", data: plan });
};

export const remove = async (req: Request, res: Response) => {
  await service.deletePlan(String(req.params.id));
  await logActivity({ userId: currentUserId(req), action: "admin.plan_deleted", entity: "plan", entityId: String(req.params.id) });
  sendResponse(res, { message: "Plan deleted" });
};
