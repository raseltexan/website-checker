import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { userIdParam } from "../../utils/validation.js";
import * as controller from "./billing.controller.js";
import { changePlanSchema, subscriptionListQuery } from "./billing.validation.js";

export const billingRouter = Router();
billingRouter.get("/subscription", controller.getSubscription);
billingRouter.post("/change-plan", validate({ body: changePlanSchema }), controller.changePlan);
billingRouter.post("/cancel", controller.cancel);
billingRouter.post("/resume", controller.resume);

export const adminSubscriptionsRouter = Router();
adminSubscriptionsRouter.get("/", validate({ query: subscriptionListQuery }), controller.adminList);
adminSubscriptionsRouter.patch("/users/:id", validate({ params: userIdParam, body: changePlanSchema }), controller.adminAssign);
