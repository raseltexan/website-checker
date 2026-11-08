import type { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { CHECKS_BY_KEY } from "../../engine/registry.js";
import { getBrowserProviderStatus } from "../../engine/integrations/browser.js";
import { getSetting } from "../settings/settings.service.js";
import type { updateCategorySchema, updateCheckSchema } from "./checkers.validation.js";

/** Catalog with availability info so the UI can explain checks that need an integration. */
const withAvailability = async <T extends { checks: { key: string }[] }>(categories: T[]) => {
  const browser = getBrowserProviderStatus(await getSetting("browser"));
  return categories.map((cat) => ({
    ...cat,
    checks: cat.checks.map((check) => {
      const requires = CHECKS_BY_KEY.get(check.key)?.requires ?? null;
      const unavailableReason = requires === "browser" && !browser.available ? browser.reason : null;
      return { ...check, requires, available: !unavailableReason, unavailableReason };
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

export const updateCategory = (id: string, data: z.infer<typeof updateCategorySchema>) => prisma.checkerCategory.update({ where: { id }, data });

export const updateCheck = (id: string, data: z.infer<typeof updateCheckSchema>) => prisma.check.update({ where: { id }, data });

/** Keys of all enabled checks — used when a scan request doesn't specify checks. */
export const enabledCheckKeys = async () =>
  (await prisma.check.findMany({ where: { isEnabled: true, category: { isEnabled: true } }, select: { key: true } })).map((c) => c.key);
