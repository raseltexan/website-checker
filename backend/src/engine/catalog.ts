import { prisma } from "../config/prisma.js";
import { CATEGORY_DEFINITIONS, CHECK_DEFINITIONS } from "./registry.js";

/**
 * Ensures every category/check implemented in code exists in the DB.
 * Existing rows are left untouched so admin customisations (names, severity, toggles) persist.
 */
export const syncCatalog = async () => {
  const categoryIds = new Map<string, string>();
  for (const def of CATEGORY_DEFINITIONS) {
    const row = await prisma.checkerCategory.upsert({ where: { key: def.key }, create: def, update: {} });
    categoryIds.set(def.key, row.id);
  }
  for (const [index, def] of CHECK_DEFINITIONS.entries()) {
    const categoryId = categoryIds.get(def.categoryKey);
    if (!categoryId) continue;
    await prisma.check.upsert({
      where: { key: def.key },
      create: { key: def.key, categoryId, name: def.name, description: def.description, severity: def.severity, weight: def.weight, order: index },
      update: {},
    });
  }
};
