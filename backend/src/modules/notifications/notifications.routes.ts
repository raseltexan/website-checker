import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { idParam } from "../../utils/validation.js";
import * as controller from "./notifications.controller.js";
import { broadcastSchema, notificationListQuery } from "./notifications.validation.js";

export const notificationsRouter = Router();
notificationsRouter.get("/", validate({ query: notificationListQuery }), controller.list);
notificationsRouter.get("/unread-count", controller.unreadCount);
notificationsRouter.post("/read-all", controller.markAllRead);
notificationsRouter.patch("/:id/read", validate({ params: idParam }), controller.markRead);
notificationsRouter.delete("/:id", validate({ params: idParam }), controller.remove);

export const adminNotificationsRouter = Router();
adminNotificationsRouter.get("/", validate({ query: notificationListQuery }), controller.adminList);
adminNotificationsRouter.post("/broadcast", validate({ body: broadcastSchema }), controller.adminBroadcast);
