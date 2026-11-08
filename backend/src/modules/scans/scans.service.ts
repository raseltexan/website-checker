import type { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { assertPublicHost, normalizeUrl } from "../../utils/url.js";
import { buildListArgs, buildSearch, paginate } from "../../utils/query.js";
import { scanQueue } from "../../engine/runner.js";
import { assertScanQuota } from "../billing/billing.service.js";
import { enabledCheckKeys } from "../checkers/checkers.service.js";
import { ensureWebsiteForUrl, getWebsite } from "../websites/websites.service.js";
import type { createScanSchema, ScanListQuery } from "./scans.validation.js";

const ACTIVE = ["QUEUED", "RUNNING"] as const;

export const createScan = async (userId: string, input: z.infer<typeof createScanSchema>) => {
  const url = normalizeUrl(input.url);
  await assertPublicHost(url.hostname);
  await assertScanQuota(userId);

  const enabled = await enabledCheckKeys();
  const selectedChecks = input.checks?.length ? input.checks.filter((k) => enabled.includes(k)) : enabled;
  if (!selectedChecks.length) throw ApiError.badRequest("Select at least one available check");

  const website = input.websiteId ? await getWebsite(input.websiteId, userId) : await ensureWebsiteForUrl(userId, url);
  const scan = await prisma.scan.create({ data: { userId, websiteId: website?.id ?? null, url: url.toString(), selectedChecks } });
  scanQueue.enqueue(scan.id);
  return scan;
};

export const listScans = (query: ScanListQuery, ownerId?: string) => {
  const where = {
    ...(ownerId ? { userId: ownerId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.websiteId ? { websiteId: query.websiteId } : {}),
    ...buildSearch(query.search, ["url"]),
  };
  return paginate(
    query,
    () =>
      prisma.scan.findMany({
        where,
        ...buildListArgs(query, ["createdAt", "score", "status", "completedAt"]),
        omit: { selectedChecks: true, categoryScores: true },
        include: {
          website: { select: { id: true, name: true } },
          report: { select: { id: true } },
          ...(ownerId ? {} : { user: { select: { id: true, name: true, email: true } } }),
        },
      }),
    () => prisma.scan.count({ where }),
  );
};

export const getScan = async (id: string, ownerId?: string) => {
  const scan = await prisma.scan.findFirst({
    where: { id, ...(ownerId ? { userId: ownerId } : {}) },
    include: {
      results: { orderBy: { createdAt: "asc" } },
      website: { select: { id: true, name: true } },
      report: { select: { id: true } },
    },
  });
  if (!scan) throw ApiError.notFound("Scan");
  return scan;
};

export const cancelScan = async (id: string, ownerId?: string) => {
  const scan = await getScan(id, ownerId);
  if (!ACTIVE.includes(scan.status as (typeof ACTIVE)[number])) throw ApiError.badRequest("Only queued or running scans can be cancelled");
  return prisma.scan.update({ where: { id }, data: { status: "CANCELLED", completedAt: new Date() } });
};

export const rescan = async (id: string, userId: string) => {
  const scan = await getScan(id, userId);
  return createScan(userId, { url: scan.url, checks: scan.selectedChecks, websiteId: scan.websiteId ?? undefined });
};

export const deleteScan = async (id: string, ownerId?: string) => {
  const scan = await getScan(id, ownerId);
  if (scan.status === "RUNNING") throw ApiError.badRequest("Cancel the scan before deleting it");
  await prisma.scan.delete({ where: { id } });
};

export const queueStats = async () => {
  const grouped = await prisma.scan.groupBy({ by: ["status"], _count: { _all: true } });
  return { queue: scanQueue.stats(), byStatus: Object.fromEntries(grouped.map((g) => [g.status, g._count._all])) };
};
