import type { Request, Response } from "express";
import { currentUserId } from "../../middlewares/auth.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { logActivity } from "../../utils/activity.js";
import * as service from "./notifications.service.js";
import type { NotificationListQuery } from "./notifications.validation.js";

const id = (req: Request) => String(req.params.id);

export const list = async (req: Request, res: Response) => {
  sendResponse(res, await service.listNotifications(req.query as unknown as NotificationListQuery, currentUserId(req)));
};

export const unreadCount = async (req: Request, res: Response) => {
  sendResponse(res, { data: { count: await service.unreadCount(currentUserId(req)) } });
};

export const markRead = async (req: Request, res: Response) => {
  await service.markRead(id(req), currentUserId(req));
  sendResponse(res, { message: "Marked as read" });
};

export const markAllRead = async (req: Request, res: Response) => {
  await service.markAllRead(currentUserId(req));
  sendResponse(res, { message: "All notifications marked as read" });
};

export const remove = async (req: Request, res: Response) => {
  await service.deleteNotification(id(req), currentUserId(req));
  sendResponse(res, { message: "Notification deleted" });
};

export const adminList = async (req: Request, res: Response) => {
  sendResponse(res, await service.listNotifications(req.query as unknown as NotificationListQuery));
};

export const adminBroadcast = async (req: Request, res: Response) => {
  const result = await service.broadcast(req.body);
  await logActivity({ userId: currentUserId(req), action: "admin.notification_broadcast", entity: "notification", metadata: { title: req.body.title, sent: result.sent } });
  sendResponse(res, { statusCode: 201, message: `Notification sent to ${result.sent} user(s)`, data: result });
};
