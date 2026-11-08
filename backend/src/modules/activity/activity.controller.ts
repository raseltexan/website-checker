import type { Request, Response } from "express";
import { currentUserId } from "../../middlewares/auth.js";
import { sendResponse } from "../../utils/sendResponse.js";
import * as service from "./activity.service.js";
import type { ActivityListQuery } from "./activity.validation.js";

export const listMine = async (req: Request, res: Response) => {
  sendResponse(res, await service.listActivity(req.query as unknown as ActivityListQuery, currentUserId(req)));
};

export const adminList = async (req: Request, res: Response) => {
  sendResponse(res, await service.listActivity(req.query as unknown as ActivityListQuery));
};
