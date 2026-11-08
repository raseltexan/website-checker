import type { Request, Response } from "express";
import { currentUserId } from "../../middlewares/auth.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { logActivity } from "../../utils/activity.js";
import * as service from "./billing.service.js";
import type { SubscriptionListQuery } from "./billing.validation.js";

export const getSubscription = async (req: Request, res: Response) => {
  sendResponse(res, { data: await service.getSubscription(currentUserId(req)) });
};

export const changePlan = async (req: Request, res: Response) => {
  const data = await service.changePlan(currentUserId(req), req.body.planId, req.body.interval);
  sendResponse(res, { message: "checkoutUrl" in data ? "Redirecting to checkout" : "Plan updated", data });
};

export const cancel = async (req: Request, res: Response) => {
  sendResponse(res, { message: "Subscription will cancel at the end of the period", data: await service.cancelSubscription(currentUserId(req)) });
};

export const resume = async (req: Request, res: Response) => {
  sendResponse(res, { message: "Subscription resumed", data: await service.resumeSubscription(currentUserId(req)) });
};

export const adminList = async (req: Request, res: Response) => {
  sendResponse(res, await service.listSubscriptions(req.query as unknown as SubscriptionListQuery));
};

export const adminAssign = async (req: Request, res: Response) => {
  const userId = String(req.params.id);
  const subscription = await service.assignPlan(userId, req.body.planId, req.body.interval);
  await logActivity({ userId: currentUserId(req), action: "admin.plan_assigned", entity: "user", entityId: userId, metadata: { planId: req.body.planId } });
  sendResponse(res, { message: "Plan assigned", data: subscription });
};
