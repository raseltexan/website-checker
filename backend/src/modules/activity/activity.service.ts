import { prisma } from "../../config/prisma.js";
import { buildListArgs, buildSearch, paginate } from "../../utils/query.js";
import type { ActivityListQuery } from "./activity.validation.js";

export const listActivity = (query: ActivityListQuery, ownerId?: string) => {
  const userId = ownerId ?? query.userId;
  const where = {
    ...(userId ? { userId } : {}),
    ...(query.level ? { level: query.level } : {}),
    ...(query.action ? { action: { startsWith: query.action } } : {}),
    ...(query.from || query.to ? { createdAt: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } } : {}),
    ...buildSearch(query.search, ["action", "entity", "ipAddress"]),
  };
  return paginate(
    query,
    () =>
      prisma.activityLog.findMany({
        where,
        ...buildListArgs(query, ["createdAt", "action", "level"]),
        ...(ownerId ? {} : { include: { user: { select: { id: true, name: true, email: true } } } }),
      }),
    () => prisma.activityLog.count({ where }),
  );
};
