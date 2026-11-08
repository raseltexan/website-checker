import { unavailable, type CheckDefinition } from "../types.js";

const category = "browser";

/**
 * Browser & device checks need a real rendering engine (e.g. Playwright or Browserless).
 * They are registered so they appear in the catalog and admin configuration, but report
 * UNAVAILABLE until a provider is implemented in `engine/integrations/browser.ts`.
 */
const browserCheck = (key: string, name: string, description: string, severity: CheckDefinition["severity"]): CheckDefinition => ({
  key: `${category}.${key}`,
  categoryKey: category,
  name,
  description,
  severity,
  weight: 2,
  requires: "browser",
  run: async () => unavailable(`${name} is not implemented for this browser provider yet`),
});

export const browserChecks: CheckDefinition[] = [
  browserCheck("cross-browser", "Cross-browser rendering", "Renders the page in Chromium, Firefox and WebKit and compares results.", "MEDIUM"),
  browserCheck("responsive", "Responsive layout", "Checks for horizontal overflow at the configured device sizes.", "HIGH"),
  browserCheck("console-errors", "JavaScript console errors", "Captures uncaught errors and failed requests while loading.", "MEDIUM"),
  browserCheck("screenshots", "Device screenshots", "Captures screenshots for each configured device.", "LOW"),
];
