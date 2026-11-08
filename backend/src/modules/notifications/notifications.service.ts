import type { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { buildListArgs, buildSearch, paginate } from "../../utils/query.js";
import type { broadcastSchema, NotificationListQuery } from "./notifications.validation.js";

export const listNotifications = (query: NotificationListQuery, ownerId?: string) => {
  const where = {
    ...(ownerId ? { userId: ownerId } : {}),
    ...(query.unread !== undefined ? { read: !query.unread } : {}),
    ...buildSearch(query.search, ["title", "message"]),
  };
  return paginate(
    query,
    () =>
      prisma.notification.findMany({
        where,
        ...buildListArgs(query, ["createdAt"]),
        ...(ownerId ? {} : { include: { user: { select: { id: true, name: true, email: true } } } }),
      }),
    () => prisma.notification.count({ where }),
  );
};

export const unreadCount = (userId: string) => prisma.notification.count({ where: { userId, read: false } });

export const markRead = async (id: string, userId: string) => {
  const { count } = await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
  if (!count) throw ApiError.notFound("Notification");
};

export const markAllRead = (userId: string) => prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });

export const deleteNotification = async (id: string, userId: string) => {
  const { count } = await prisma.notification.deleteMany({ where: { id, userId } });
  if (!count) throw ApiError.notFound("Notification");
};

export const broadcast = async ({ userIds, ...payload }: z.infer<typeof broadcastSchema>) => {
  const recipients = userIds?.length
    ? userIds
    : (await prisma.user.findMany({ where: { banned: { not: true } }, select: { id: true } })).map((u) => u.id);
  if (!recipients.length) throw ApiError.badRequest("No recipients found");
  const { count } = await prisma.notification.createMany({ data: recipients.map((userId) => ({ userId, ...payload })) });
  return { sent: count };
};
