import type { Request, Response } from "express";
import { currentUserId } from "../../middlewares/auth.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { logActivity } from "../../utils/activity.js";
import type { ListQuery } from "../../utils/query.js";
import * as service from "./reports.service.js";

const id = (req: Request) => String(req.params.id);

export const list = async (req: Request, res: Response) => {
  sendResponse(res, await service.listReports(req.query as unknown as ListQuery, currentUserId(req)));
};

export const get = async (req: Request, res: Response) => {
  sendResponse(res, { data: await service.getReport(id(req), currentUserId(req)) });
};

export const remove = async (req: Request, res: Response) => {
  await service.deleteReport(id(req), currentUserId(req));
  sendResponse(res, { message: "Report deleted" });
};

export const adminList = async (req: Request, res: Response) => {
  sendResponse(res, await service.listReports(req.query as unknown as ListQuery));
};

export const adminGet = async (req: Request, res: Response) => {
  sendResponse(res, { data: await service.getReport(id(req)) });
};

export const adminRemove = async (req: Request, res: Response) => {
  await service.deleteReport(id(req));
  await logActivity({ userId: currentUserId(req), action: "admin.report_deleted", entity: "report", entityId: id(req) });
  sendResponse(res, { message: "Report deleted" });
};
