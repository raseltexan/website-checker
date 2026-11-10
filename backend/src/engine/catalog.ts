import { prisma } from "../config/prisma.js";
import { CATEGORY_DEFINITIONS, CHECK_DEFINITIONS, MANDATORY_CATEGORY_KEYS } from "./registry.js";

/**
 * Previous default descriptions. When a row still carries one of these (i.e. an admin
 * never edited it), it is refreshed to the current code description.
 */
const LEGACY_DESCRIPTIONS: Record<string, string> = {
  browser: "Real-browser rendering across browsers and devices.",
  "browser.cross-browser": "Renders the page in Chromium, Firefox and WebKit and compares results.",
  "browser.responsive": "Checks for horizontal overflow at the configured device sizes.",
  "browser.console-errors": "Captures uncaught errors and failed requests while loading.",
};

/** Previous default check names, refreshed the same way. */
const LEGACY_NAMES: Record<string, string> = {
  "browser.cross-browser": "Cross-browser rendering",
  "browser.console-errors": "JavaScript console errors",
};

/**
 * Ensures every category/check implemented in code exists in the DB.
 * Existing rows keep admin customisations (names, severity, toggles), except that
 * mandatory checks and their categories are always forced back on.
 */
export const syncCatalog = async () => {
  const categoryIds = new Map<string, string>();
  for (const def of CATEGORY_DEFINITIONS) {
    const mandatory = MANDATORY_CATEGORY_KEYS.includes(def.key);
    const row = await prisma.checkerCategory.upsert({ where: { key: def.key }, create: def, update: mandatory ? { isEnabled: true } : {} });
    if (LEGACY_DESCRIPTIONS[def.key] === row.description) {
      await prisma.checkerCategory.update({ where: { id: row.id }, data: { description: def.description } });
    }
    categoryIds.set(def.key, row.id);
  }
  for (const [index, def] of CHECK_DEFINITIONS.entries()) {
    const categoryId = categoryIds.get(def.categoryKey);
    if (!categoryId) continue;
    const row = await prisma.check.upsert({
      where: { key: def.key },
      create: { key: def.key, categoryId, name: def.name, description: def.description, severity: def.severity, weight: def.weight, order: index },
      update: def.mandatory ? { isEnabled: true } : {},
    });
    const refresh = {
      ...(LEGACY_DESCRIPTIONS[def.key] === row.description ? { description: def.description } : {}),
      ...(LEGACY_NAMES[def.key] === row.name ? { name: def.name } : {}),
    };
    if (Object.keys(refresh).length) await prisma.check.update({ where: { id: row.id }, data: refresh });
  }
};
