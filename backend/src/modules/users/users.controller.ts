import type { Request, Response } from "express";
import { currentUserId } from "../../middlewares/auth.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { logActivity } from "../../utils/activity.js";
import * as service from "./users.service.js";
import type { UserListQuery } from "./users.validation.js";

const id = (req: Request) => String(req.params.id);

export const me = async (req: Request, res: Response) => {
  sendResponse(res, { data: await service.getProfile(currentUserId(req)) });
};

export const updateMe = async (req: Request, res: Response) => {
  const user = await service.updateProfile(currentUserId(req), req.body);
  await logActivity({ userId: user.id, action: "user.profile_updated", entity: "user", entityId: user.id });
  sendResponse(res, { message: "Profile updated", data: user });
};

export const dashboard = async (req: Request, res: Response) => {
  sendResponse(res, { data: await service.getDashboard(currentUserId(req)) });
};

export const sessions = async (req: Request, res: Response) => {
  const list = await service.listSessions(currentUserId(req));
  sendResponse(res, { data: list.map((s) => ({ ...s, current: s.id === req.session?.id })) });
};

export const revokeSession = async (req: Request, res: Response) => {
  await service.revokeSession(currentUserId(req), String(req.params.sessionId));
  await logActivity({ userId: currentUserId(req), action: "user.session_revoked", level: "SECURITY" });
  sendResponse(res, { message: "Session revoked" });
};

export const deleteMe = async (req: Request, res: Response) => {
  await logActivity({ action: "user.account_deleted", level: "SECURITY", metadata: { email: req.user?.email ?? null } });
  await service.deleteAccount(currentUserId(req));
  sendResponse(res, { message: "Account deleted" });
};

// ───────────── Admin ─────────────

export const adminList = async (req: Request, res: Response) => {
  sendResponse(res, await service.listUsers(req.query as unknown as UserListQuery));
};

export const adminGet = async (req: Request, res: Response) => {
  sendResponse(res, { data: await service.getUserDetails(id(req)) });
};

export const adminUpdate = async (req: Request, res: Response) => {
  const user = await service.adminUpdateUser(currentUserId(req), id(req), req.body);
  await logActivity({ userId: currentUserId(req), action: "admin.user_updated", entity: "user", entityId: user.id, level: req.body.role ? "SECURITY" : "INFO", metadata: req.body });
  sendResponse(res, { message: "User updated", data: user });
};

export const adminBan = async (req: Request, res: Response) => {
  const user = await service.banUser(currentUserId(req), id(req), req.body);
  await logActivity({ userId: currentUserId(req), action: "admin.user_banned", entity: "user", entityId: user.id, level: "SECURITY", metadata: req.body });
  sendResponse(res, { message: "User suspended", data: user });
};

export const adminUnban = async (req: Request, res: Response) => {
  const user = await service.unbanUser(id(req));
  await logActivity({ userId: currentUserId(req), action: "admin.user_unbanned", entity: "user", entityId: user.id, level: "SECURITY" });
  sendResponse(res, { message: "User reactivated", data: user });
};

export const adminRevokeSessions = async (req: Request, res: Response) => {
  const { count } = await service.adminRevokeSessions(id(req));
  await logActivity({ userId: currentUserId(req), action: "admin.sessions_revoked", entity: "user", entityId: id(req), level: "SECURITY" });
  sendResponse(res, { message: `${count} session(s) revoked` });
};

export const adminRemove = async (req: Request, res: Response) => {
  await service.adminDeleteUser(currentUserId(req), id(req));
  await logActivity({ userId: currentUserId(req), action: "admin.user_deleted", entity: "user", entityId: id(req), level: "SECURITY" });
  sendResponse(res, { message: "User deleted" });
};
