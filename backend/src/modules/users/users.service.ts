import type { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { buildListArgs, buildSearch, paginate } from "../../utils/query.js";
import { getUsage, getUserPlan } from "../billing/billing.service.js";
import type { adminUpdateUserSchema, banUserSchema, updateProfileSchema, UserListQuery } from "./users.validation.js";

const PUBLIC_USER = {
  id: true, name: true, email: true, emailVerified: true, image: true, role: true,
  banned: true, banReason: true, banExpires: true, company: true, timezone: true, createdAt: true, updatedAt: true,
} as const;

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: PUBLIC_USER });
  if (!user) throw ApiError.notFound("User");
  const [plan, usage] = await Promise.all([getUserPlan(userId), getUsage(userId)]);
  return { ...user, plan, usage };
};

export const updateProfile = (userId: string, data: z.infer<typeof updateProfileSchema>) =>
  prisma.user.update({ where: { id: userId }, data: { ...data, image: data.image === "" ? null : data.image }, select: PUBLIC_USER });

export const listSessions = (userId: string) =>
  prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    select: { id: true, ipAddress: true, userAgent: true, createdAt: true, expiresAt: true },
    orderBy: { createdAt: "desc" },
  });

export const revokeSession = async (userId: string, sessionId: string) => {
  const { count } = await prisma.session.deleteMany({ where: { id: sessionId, userId } });
  if (!count) throw ApiError.notFound("Session");
};

export const deleteAccount = (userId: string) => prisma.user.delete({ where: { id: userId } });

/** Aggregates for the user dashboard. */
export const getDashboard = async (userId: string) => {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [websites, totalScans, activeScans, recentScans, completed, plan, usage] = await Promise.all([
    prisma.website.count({ where: { userId } }),
    prisma.scan.count({ where: { userId } }),
    prisma.scan.count({ where: { userId, status: { in: ["QUEUED", "RUNNING"] } } }),
    prisma.scan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, url: true, status: true, score: true, progress: true, createdAt: true },
    }),
    prisma.scan.findMany({
      where: { userId, status: "COMPLETED", completedAt: { gte: since } },
      orderBy: { completedAt: "asc" },
      select: { score: true, completedAt: true, summary: true },
    }),
    getUserPlan(userId),
    getUsage(userId),
  ]);
  const scores = completed.map((s) => s.score ?? 0);
  const issues = completed.reduce((sum, s) => sum + Number((s.summary as { FAIL?: number } | null)?.FAIL ?? 0), 0);
  return {
    stats: {
      websites,
      totalScans,
      activeScans,
      averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      issuesFound: issues,
    },
    scoreTrend: completed.map((s) => ({ date: s.completedAt, score: s.score })),
    recentScans,
    plan,
    usage,
  };
};

// ───────────── Admin ─────────────

export const listUsers = (query: UserListQuery) => {
  const where = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.status === "banned" ? { banned: true } : query.status === "active" ? { banned: { not: true } } : {}),
    ...buildSearch(query.search, ["name", "email", "company"]),
  };
  return paginate(
    query,
    () =>
      prisma.user.findMany({
        where,
        ...buildListArgs(query, ["createdAt", "name", "email"]),
        select: { ...PUBLIC_USER, subscription: { select: { plan: { select: { name: true } }, status: true } }, _count: { select: { websites: true, scans: true } } },
      }),
    () => prisma.user.count({ where }),
  );
};

export const getUserDetails = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...PUBLIC_USER,
      subscription: { include: { plan: true } },
      _count: { select: { websites: true, scans: true, reports: true } },
      sessions: { select: { id: true, ipAddress: true, userAgent: true, createdAt: true, expiresAt: true }, orderBy: { createdAt: "desc" }, take: 10 },
      activityLogs: { orderBy: { createdAt: "desc" }, take: 15 },
    },
  });
  if (!user) throw ApiError.notFound("User");
  return user;
};

const assertNotSelf = (actorId: string, targetId: string, action: string) => {
  if (actorId === targetId) throw ApiError.badRequest(`You cannot ${action} your own account`);
};

export const adminUpdateUser = async (actorId: string, id: string, data: z.infer<typeof adminUpdateUserSchema>) => {
  if (data.role && data.role !== "admin") assertNotSelf(actorId, id, "demote");
  return prisma.user.update({ where: { id }, data, select: PUBLIC_USER });
};

export const banUser = async (actorId: string, id: string, { reason, expiresInDays }: z.infer<typeof banUserSchema>) => {
  assertNotSelf(actorId, id, "ban");
  const user = await prisma.user.update({
    where: { id },
    data: { banned: true, banReason: reason ?? "Suspended by administrator", banExpires: expiresInDays ? new Date(Date.now() + expiresInDays * 86_400_000) : null },
    select: PUBLIC_USER,
  });
  await prisma.session.deleteMany({ where: { userId: id } });
  return user;
};

export const unbanUser = (id: string) => prisma.user.update({ where: { id }, data: { banned: false, banReason: null, banExpires: null }, select: PUBLIC_USER });

export const adminDeleteUser = async (actorId: string, id: string) => {
  assertNotSelf(actorId, id, "delete");
  await prisma.user.delete({ where: { id } });
};

export const adminRevokeSessions = (id: string) => prisma.session.deleteMany({ where: { userId: id } });
