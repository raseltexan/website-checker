import type { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { CHECKS_BY_KEY, MANDATORY_CATEGORY_KEYS, MANDATORY_CHECK_KEYS } from "../../engine/registry.js";
import { ApiError } from "../../utils/ApiError.js";
import { getBrowserProviderStatus } from "../../engine/integrations/browser.js";
import { getSetting } from "../settings/settings.service.js";
import type { updateCategorySchema, updateCheckSchema } from "./checkers.validation.js";

/** Catalog with availability info so the UI can explain checks that need an integration. */
interface Availability {
  requires: string | null;
  mandatory: boolean;
  available: boolean;
  unavailableReason: string | null;
}

const withAvailability = async <C extends { key: string }, T extends { checks: C[] }>(
  categories: T[],
): Promise<(Omit<T, "checks"> & { checks: (C & Availability)[] })[]> => {
  const browser = getBrowserProviderStatus(await getSetting("browser"));
  return categories.map((cat) => ({
    ...cat,
    checks: cat.checks.map((check) => {
      const def = CHECKS_BY_KEY.get(check.key);
      const requires = def?.requires ?? null;
      const unavailableReason = requires === "browser" && !browser.available ? browser.reason : null;
      return { ...check, requires, mandatory: Boolean(def?.mandatory), available: !unavailableReason, unavailableReason };
    }),
  }));
};

export const listEnabledCatalog = async () =>
  withAvailability(
    await prisma.checkerCategory.findMany({
      where: { isEnabled: true },
      orderBy: { order: "asc" },
      include: { checks: { where: { isEnabled: true }, orderBy: { order: "asc" } } },
    }),
  );

export const listFullCatalog = async () =>
  withAvailability(
    await prisma.checkerCategory.findMany({ orderBy: { order: "asc" }, include: { checks: { orderBy: { order: "asc" } } } }),
  );

export const updateCategory = async (id: string, data: z.infer<typeof updateCategorySchema>) => {
  if (data.isEnabled === false) {
    const category = await prisma.checkerCategory.findUnique({ where: { id }, select: { key: true, name: true } });
    if (category && MANDATORY_CATEGORY_KEYS.includes(category.key)) throw ApiError.badRequest(`${category.name} contains mandatory checks and cannot be disabled`);
  }
  return prisma.checkerCategory.update({ where: { id }, data });
};

export const updateCheck = async (id: string, data: z.infer<typeof updateCheckSchema>) => {
  if (data.isEnabled === false) {
    const check = await prisma.check.findUnique({ where: { id }, select: { key: true, name: true } });
    if (check && MANDATORY_CHECK_KEYS.includes(check.key)) throw ApiError.badRequest(`${check.name} is a mandatory check and cannot be disabled`);
  }
  return prisma.check.update({ where: { id }, data });
};

/** Keys of all enabled checks — used when a scan request doesn't specify checks. */
export const enabledCheckKeys = async () =>
  (await prisma.check.findMany({ where: { isEnabled: true, category: { isEnabled: true } }, select: { key: true } })).map((c) => c.key);

/** Public numbers for the marketing page, computed from the live catalog and scan history. */
export const publicStats = async () => {
  const [catalog, scansCompleted, websitesAudited] = await Promise.all([
    listEnabledCatalog(),
    prisma.scan.count({ where: { status: "COMPLETED" } }),
    prisma.website.count({ where: { lastScanAt: { not: null } } }),
  ]);
  const categories = catalog
    .map((c) => ({ key: c.key, name: c.name, description: c.description, icon: c.icon, checks: c.checks.filter((k) => k.available).length }))
    .filter((c) => c.checks > 0);
  return {
    checks: categories.reduce((n, c) => n + c.checks, 0),
    categories: categories.length,
    scansCompleted,
    websitesAudited,
    categoryList: categories,
  };
};
