import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { settingsSchemas, type SettingKey, type Settings } from "./settings.validation.js";

/** Returns a setting merged over its defaults, so callers always get a complete object. */
export const getSetting = async <K extends SettingKey>(key: K): Promise<Settings[K]> => {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  const schema = settingsSchemas[key];
  const parsed = schema.safeParse({ ...schema.parse({}), ...((row?.value as object | null) ?? {}) });
  return (parsed.success ? parsed.data : schema.parse({})) as Settings[K];
};

export const getAllSettings = async () => {
  const keys = Object.keys(settingsSchemas) as SettingKey[];
  const entries = await Promise.all(keys.map(async (k) => [k, await getSetting(k)] as const));
  return Object.fromEntries(entries) as Settings;
};

export const updateSetting = async <K extends SettingKey>(key: K, patch: Partial<Settings[K]>) => {
  const current = await getSetting(key);
  const value = settingsSchemas[key].parse({ ...current, ...patch }) as Prisma.InputJsonValue;
  await prisma.appSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
  return value as Settings[K];
};
