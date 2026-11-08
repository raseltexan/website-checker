import type { Settings } from "../../modules/settings/settings.validation.js";

export interface BrowserProviderStatus {
  provider: Settings["browser"]["provider"];
  available: boolean;
  reason: string;
}

/**
 * Integration point for a headless-browser provider. No provider ships with the
 * platform yet, so every configuration reports unavailable with an explicit reason.
 * Implement a provider here (and wire it into the browser checks) to enable them.
 */
export const getBrowserProviderStatus = (config: Settings["browser"]): BrowserProviderStatus => {
  if (config.provider === "none") {
    return { provider: "none", available: false, reason: "No browser provider configured (Admin → Browser & Device Testing)" };
  }
  return { provider: config.provider, available: false, reason: `The "${config.provider}" provider integration has not been implemented yet` };
};
