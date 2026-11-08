import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import * as controller from "./activity.controller.js";
import { activityListQuery } from "./activity.validation.js";

export const activityRouter = Router();
activityRouter.get("/", validate({ query: activityListQuery }), controller.listMine);

export const adminActivityRouter = Router();
adminActivityRouter.get("/", validate({ query: activityListQuery }), controller.adminList);
