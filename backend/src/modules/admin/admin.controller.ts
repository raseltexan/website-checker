import type { Request, Response } from "express";
import { currentUserId } from "../../middlewares/auth.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { logActivity } from "../../utils/activity.js";
import { getAllSettings, updateSetting } from "../settings/settings.service.js";
import { settingsSchemas, type SettingKey } from "../settings/settings.validation.js";
import * as service from "./admin.service.js";
import type { EmailLogQuery } from "./admin.validation.js";

export const overview = async (_req: Request, res: Response) => {
  sendResponse(res, { data: await service.getOverview() });
};

export const systemHealth = async (_req: Request, res: Response) => {
  sendResponse(res, { data: await service.getSystemHealth() });
};

export const security = async (_req: Request, res: Response) => {
  sendResponse(res, { data: await service.getSecurityOverview() });
};

export const revokeSession = async (req: Request, res: Response) => {
  await service.revokeSession(String(req.params.id));
  await logActivity({ userId: currentUserId(req), action: "admin.session_revoked", entity: "session", entityId: String(req.params.id), level: "SECURITY" });
  sendResponse(res, { message: "Session revoked" });
};

export const emailOverview = async (_req: Request, res: Response) => {
  sendResponse(res, { data: await service.getEmailOverview() });
};

export const emailLogs = async (req: Request, res: Response) => {
  sendResponse(res, await service.listEmailLogs(req.query as unknown as EmailLogQuery));
};

export const testEmail = async (req: Request, res: Response) => {
  const sent = await service.sendTestEmail(req.body.to);
  sendResponse(res, { message: sent ? "Test email sent" : "Email was not sent — check the email log for details", data: { sent } });
};

export const browserTesting = async (_req: Request, res: Response) => {
  sendResponse(res, { data: await service.getBrowserTesting() });
};

export const getSettings = async (_req: Request, res: Response) => {
  sendResponse(res, { data: await getAllSettings() });
};

export const updateSettings = async (req: Request, res: Response) => {
  const key = String(req.params.key) as SettingKey;
  const patch = settingsSchemas[key].partial().parse(req.body);
  const value = await updateSetting(key, patch);
  await logActivity({ userId: currentUserId(req), action: `admin.settings_updated`, entity: "settings", entityId: key, metadata: patch });
  sendResponse(res, { message: "Settings saved", data: value });
};
