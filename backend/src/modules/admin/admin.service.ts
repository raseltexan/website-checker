import os from "node:os";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { scanQueue } from "../../engine/runner.js";
import { CHECK_DEFINITIONS } from "../../engine/registry.js";
import { getBrowserProviderStatus } from "../../engine/integrations/browser.js";
import { sendMail, verifySmtp } from "../../utils/mailer.js";
import { buildListArgs, buildSearch, paginate } from "../../utils/query.js";
import { getSetting } from "../settings/settings.service.js";
import type { EmailLogQuery } from "./admin.validation.js";

const DAY = 86_400_000;

/** Buckets dated rows into the last N calendar days (UTC), filling gaps with zero. */
const dailySeries = <T extends { createdAt: Date }>(rows: T[], days: number, value: (items: T[]) => number) => {
  const buckets = new Map<string, T[]>();
  for (let i = days - 1; i >= 0; i--) buckets.set(new Date(Date.now() - i * DAY).toISOString().slice(0, 10), []);
  for (const row of rows) buckets.get(row.createdAt.toISOString().slice(0, 10))?.push(row);
  return [...buckets].map(([date, items]) => ({ date, value: value(items) }));
};

export const getOverview = async () => {
  const since = new Date(Date.now() - 30 * DAY);
  const [users, admins, banned, websites, scans, reports, activeScans, recentUsers, recentScans, scanRows, plans, failedScans] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.user.count({ where: { banned: true } }),
    prisma.website.count(),
    prisma.scan.count(),
    prisma.report.count(),
    prisma.scan.count({ where: { status: { in: ["QUEUED", "RUNNING"] } } }),
    prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.scan.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, url: true, status: true, score: true, createdAt: true, user: { select: { name: true, email: true } } },
    }),
    prisma.scan.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, status: true, score: true } }),
    prisma.plan.findMany({ orderBy: { order: "asc" }, select: { name: true, _count: { select: { subscriptions: true } } } }),
    prisma.scan.count({ where: { status: "FAILED", createdAt: { gte: since } } }),
  ]);
  const completed = scanRows.filter((s) => s.status === "COMPLETED" && s.score !== null);
  return {
    totals: { users, admins, banned, websites, scans, reports, activeScans },
    last30Days: {
      newUsers: recentUsers.length,
      scans: scanRows.length,
      failedScans,
      averageScore: completed.length ? Math.round(completed.reduce((a, s) => a + (s.score ?? 0), 0) / completed.length) : null,
    },
    charts: {
      scansPerDay: dailySeries(scanRows, 30, (items) => items.length),
      signupsPerDay: dailySeries(recentUsers, 30, (items) => items.length),
      averageScorePerDay: dailySeries(completed, 30, (items) => (items.length ? Math.round(items.reduce((a, s) => a + (s.score ?? 0), 0) / items.length) : 0)),
      planDistribution: plans.map((p) => ({ name: p.name, value: p._count.subscriptions })),
    },
    recentScans,
  };
};

const pingDatabase = async () => {
  const started = performance.now();
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    return { status: "up" as const, latencyMs: Math.round(performance.now() - started) };
  } catch (error) {
    return { status: "down" as const, latencyMs: null, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const getSystemHealth = async () => {
  const [database, smtp, browser] = await Promise.all([pingDatabase(), verifySmtp(), getSetting("browser")]);
  const mem = process.memoryUsage();
  return {
    status: database.status === "up" ? "healthy" : "degraded",
    checkedAt: new Date(),
    services: {
      api: { status: "up", uptimeSeconds: Math.round(process.uptime()) },
      database,
      smtp: { status: smtp.reachable ? "up" : smtp.configured ? "down" : "not_configured", error: smtp.error },
      scanner: { status: "up", ...scanQueue.stats(), checksRegistered: CHECK_DEFINITIONS.length },
      browser: getBrowserProviderStatus(browser),
    },
    runtime: {
      node: process.version,
      environment: env.NODE_ENV,
      platform: `${os.type()} ${os.release()}`,
      cpus: os.cpus().length,
      loadAverage: os.loadavg(),
      memory: { rssMb: Math.round(mem.rss / 1e6), heapUsedMb: Math.round(mem.heapUsed / 1e6), heapTotalMb: Math.round(mem.heapTotal / 1e6) },
      system: { totalMb: Math.round(os.totalmem() / 1e6), freeMb: Math.round(os.freemem() / 1e6) },
    },
  };
};

export const getSecurityOverview = async () => {
  const since = new Date(Date.now() - DAY);
  const [failedLogins24h, securityEvents24h, bannedUsers, activeSessions, recentEvents, sessions] = await Promise.all([
    prisma.activityLog.count({ where: { action: "auth.login_failed", createdAt: { gte: since } } }),
    prisma.activityLog.count({ where: { level: "SECURITY", createdAt: { gte: since } } }),
    prisma.user.findMany({ where: { banned: true }, select: { id: true, name: true, email: true, banReason: true, banExpires: true } }),
    prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
    prisma.activityLog.findMany({
      where: { level: "SECURITY" },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.session.findMany({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: { id: true, ipAddress: true, userAgent: true, createdAt: true, expiresAt: true, user: { select: { id: true, name: true, email: true, role: true } } },
    }),
  ]);
  return { stats: { failedLogins24h, securityEvents24h, bannedUsers: bannedUsers.length, activeSessions }, bannedUsers, recentEvents, sessions };
};

export const revokeSession = (id: string) => prisma.session.delete({ where: { id } });

export const listEmailLogs = (query: EmailLogQuery) => {
  const where = { ...(query.status ? { status: query.status } : {}), ...buildSearch(query.search, ["to", "subject", "template"]) };
  return paginate(
    query,
    () => prisma.emailLog.findMany({ where, ...buildListArgs(query, ["createdAt", "status"]) }),
    () => prisma.emailLog.count({ where }),
  );
};

export const getEmailOverview = async () => {
  const [smtp, grouped] = await Promise.all([verifySmtp(), prisma.emailLog.groupBy({ by: ["status"], _count: { _all: true } })]);
  return {
    smtp: { ...smtp, host: env.SMTP_HOST || null, port: env.SMTP_PORT, secure: env.SMTP_SECURE, from: env.SMTP_FROM, user: env.SMTP_USER ? `${env.SMTP_USER.slice(0, 2)}***` : null },
    stats: Object.fromEntries(grouped.map((g) => [g.status, g._count._all])),
  };
};

export const sendTestEmail = (to: string) =>
  sendMail({ to, subject: "Texan Website Checker — SMTP test", template: "smtp-test", html: "<p>This is a test email from Texan Website Checker. SMTP is working.</p>" });

export const getBrowserTesting = async () => {
  const config = await getSetting("browser");
  const checks = await prisma.check.findMany({
    where: { key: { in: CHECK_DEFINITIONS.filter((c) => c.requires === "browser").map((c) => c.key) } },
    include: { category: { select: { name: true } } },
    orderBy: { order: "asc" },
  });
  return { config, status: getBrowserProviderStatus(config), checks };
};
