import type { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { normalizeUrl } from "../../utils/url.js";
import { buildListArgs, buildSearch, paginate } from "../../utils/query.js";
import { assertWebsiteQuota } from "../billing/billing.service.js";
import type { createWebsiteSchema, updateWebsiteSchema, WebsiteListQuery } from "./websites.validation.js";

const SORTABLE = ["createdAt", "name", "lastScanAt", "lastScore"] as const;

/** `ownerId` scopes queries to one user; omit it for admin-wide access. */
export const listWebsites = (query: WebsiteListQuery, ownerId?: string) => {
  const where = {
    ...(ownerId ? { userId: ownerId } : {}),
    ...(query.tag ? { tags: { has: query.tag } } : {}),
    ...buildSearch(query.search, ["name", "url", "domain"]),
  };
  return paginate(
    query,
    () =>
      prisma.website.findMany({
        where,
        ...buildListArgs(query, SORTABLE),
        include: { _count: { select: { scans: true } }, ...(ownerId ? {} : { user: { select: { id: true, name: true, email: true } } }) },
      }),
    () => prisma.website.count({ where }),
  );
};

export const getWebsite = async (id: string, ownerId?: string) => {
  const website = await prisma.website.findFirst({
    where: { id, ...(ownerId ? { userId: ownerId } : {}) },
    include: {
      scans: { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, status: true, score: true, createdAt: true, completedAt: true } },
      _count: { select: { scans: true, reports: true } },
    },
  });
  if (!website) throw ApiError.notFound("Website");
  return website;
};

export const createWebsite = async (userId: string, input: z.infer<typeof createWebsiteSchema>) => {
  await assertWebsiteQuota(userId);
  const url = normalizeUrl(input.url);
  return prisma.website.create({ data: { userId, name: input.name, url: url.origin + url.pathname.replace(/\/$/, ""), domain: url.hostname, tags: input.tags } });
};

export const updateWebsite = async (id: string, ownerId: string, input: z.infer<typeof updateWebsiteSchema>) => {
  await getWebsite(id, ownerId);
  const url = input.url ? normalizeUrl(input.url) : null;
  return prisma.website.update({
    where: { id },
    data: { ...input, ...(url ? { url: url.origin + url.pathname.replace(/\/$/, ""), domain: url.hostname } : {}) },
  });
};

export const deleteWebsite = async (id: string, ownerId?: string) => {
  await getWebsite(id, ownerId);
  await prisma.website.delete({ where: { id } });
};

/** Finds or creates a website record for a scanned URL so history groups by site. */
export const ensureWebsiteForUrl = async (userId: string, url: URL) => {
  const normalized = url.origin + url.pathname.replace(/\/$/, "");
  const existing = await prisma.website.findFirst({ where: { userId, url: normalized } });
  if (existing) return existing;
  try {
    await assertWebsiteQuota(userId);
  } catch {
    return null; // Over the website limit: run the scan without attaching it to a website.
  }
  return prisma.website.create({ data: { userId, name: url.hostname, url: normalized, domain: url.hostname, tags: [] } });
};
