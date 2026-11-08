import type { Request, Response } from "express";
import { currentUserId } from "../../middlewares/auth.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { logActivity } from "../../utils/activity.js";
import * as service from "./websites.service.js";
import type { WebsiteListQuery } from "./websites.validation.js";

const id = (req: Request) => String(req.params.id);

export const list = async (req: Request, res: Response) => {
  sendResponse(res, await service.listWebsites(req.query as unknown as WebsiteListQuery, currentUserId(req)));
};

export const get = async (req: Request, res: Response) => {
  sendResponse(res, { data: await service.getWebsite(id(req), currentUserId(req)) });
};

export const create = async (req: Request, res: Response) => {
  const website = await service.createWebsite(currentUserId(req), req.body);
  await logActivity({ userId: website.userId, action: "website.created", entity: "website", entityId: website.id });
  sendResponse(res, { statusCode: 201, message: "Website added", data: website });
};

export const update = async (req: Request, res: Response) => {
  sendResponse(res, { message: "Website updated", data: await service.updateWebsite(id(req), currentUserId(req), req.body) });
};

export const remove = async (req: Request, res: Response) => {
  await service.deleteWebsite(id(req), currentUserId(req));
  await logActivity({ userId: currentUserId(req), action: "website.deleted", entity: "website", entityId: id(req) });
  sendResponse(res, { message: "Website deleted" });
};

export const adminList = async (req: Request, res: Response) => {
  sendResponse(res, await service.listWebsites(req.query as unknown as WebsiteListQuery));
};

export const adminRemove = async (req: Request, res: Response) => {
  await service.deleteWebsite(id(req));
  await logActivity({ userId: currentUserId(req), action: "admin.website_deleted", entity: "website", entityId: id(req) });
  sendResponse(res, { message: "Website deleted" });
};
