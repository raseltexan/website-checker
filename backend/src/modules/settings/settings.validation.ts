import { z } from "zod";

export const generalSettingsSchema = z.object({
  siteName: z.string().min(1).max(80).default("Texan Website Checker"),
  supportEmail: z.string().email().or(z.literal("")).default(""),
  allowRegistration: z.boolean().default(true),
  maintenanceMode: z.boolean().default(false),
});

export const auditSettingsSchema = z.object({
  requestTimeoutMs: z.number().int().min(2000).max(60000).default(15000),
  maxLinksToCheck: z.number().int().min(0).max(200).default(40),
  maxPagesToCrawl: z.number().int().min(1).max(50).default(10),
  maxRedirects: z.number().int().min(0).max(20).default(10),
  slowTtfbMs: z.number().int().min(100).max(10000).default(800),
  maxPageSizeKb: z.number().int().min(100).max(20000).default(3000),
  sslExpiryWarningDays: z.number().int().min(1).max(120).default(21),
});

export const browserSettingsSchema = z.object({
  provider: z.enum(["none", "playwright", "browserless"]).default("none"),
  endpoint: z.string().url().or(z.literal("")).default(""),
  browsers: z.array(z.string()).default(["chromium", "firefox", "webkit"]),
  devices: z
    .array(z.object({ name: z.string().min(1), width: z.number().int().min(240).max(4000), height: z.number().int().min(240).max(4000) }))
    .default([
      { name: "Mobile", width: 390, height: 844 },
      { name: "Tablet", width: 820, height: 1180 },
      { name: "Desktop", width: 1440, height: 900 },
    ]),
});

export const settingsSchemas = {
  general: generalSettingsSchema,
  audit: auditSettingsSchema,
  browser: browserSettingsSchema,
} as const;

export type SettingKey = keyof typeof settingsSchemas;
export type Settings = { [K in SettingKey]: z.infer<(typeof settingsSchemas)[K]> };

export const settingKeyParam = z.object({ key: z.enum(["general", "audit", "browser"]) });
