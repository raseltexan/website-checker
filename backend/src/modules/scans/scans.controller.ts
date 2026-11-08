import type { Request, Response } from "express";
import { currentUserId } from "../../middlewares/auth.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { logActivity } from "../../utils/activity.js";
import * as service from "./scans.service.js";
import type { ScanListQuery } from "./scans.validation.js";

const id = (req: Request) => String(req.params.id);

export const create = async (req: Request, res: Response) => {
  const scan = await service.createScan(currentUserId(req), req.body);
  await logActivity({ userId: scan.userId, action: "scan.created", entity: "scan", entityId: scan.id, metadata: { url: scan.url } });
  sendResponse(res, { statusCode: 201, message: "Scan queued", data: scan });
};

export const list = async (req: Request, res: Response) => {
  sendResponse(res, await service.listScans(req.query as unknown as ScanListQuery, currentUserId(req)));
};

export const get = async (req: Request, res: Response) => {
  sendResponse(res, { data: await service.getScan(id(req), currentUserId(req)) });
};

export const cancel = async (req: Request, res: Response) => {
  sendResponse(res, { message: "Scan cancelled", data: await service.cancelScan(id(req), currentUserId(req)) });
};

export const rescan = async (req: Request, res: Response) => {
  sendResponse(res, { statusCode: 201, message: "Scan queued", data: await service.rescan(id(req), currentUserId(req)) });
};

export const remove = async (req: Request, res: Response) => {
  await service.deleteScan(id(req), currentUserId(req));
  sendResponse(res, { message: "Scan deleted" });
};

export const adminList = async (req: Request, res: Response) => {
  sendResponse(res, await service.listScans(req.query as unknown as ScanListQuery));
};

export const adminGet = async (req: Request, res: Response) => {
  sendResponse(res, { data: await service.getScan(id(req)) });
};

export const adminStats = async (_req: Request, res: Response) => {
  sendResponse(res, { data: await service.queueStats() });
};

export const adminCancel = async (req: Request, res: Response) => {
  const scan = await service.cancelScan(id(req));
  await logActivity({ userId: currentUserId(req), action: "admin.scan_cancelled", entity: "scan", entityId: scan.id });
  sendResponse(res, { message: "Scan cancelled", data: scan });
};

export const adminRemove = async (req: Request, res: Response) => {
  await service.deleteScan(id(req));
  await logActivity({ userId: currentUserId(req), action: "admin.scan_deleted", entity: "scan", entityId: id(req) });
  sendResponse(res, { message: "Scan deleted" });
};
