import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { userIdParam } from "../../utils/validation.js";
import * as controller from "./users.controller.js";
import { adminUpdateUserSchema, banUserSchema, sessionIdParam, updateProfileSchema, userListQuery } from "./users.validation.js";

export const usersRouter = Router();
usersRouter.get("/me", controller.me);
usersRouter.patch("/me", validate({ body: updateProfileSchema }), controller.updateMe);
usersRouter.delete("/me", controller.deleteMe);
usersRouter.get("/me/dashboard", controller.dashboard);
usersRouter.get("/me/sessions", controller.sessions);
usersRouter.delete("/me/sessions/:sessionId", validate({ params: sessionIdParam }), controller.revokeSession);

export const adminUsersRouter = Router();
adminUsersRouter.get("/", validate({ query: userListQuery }), controller.adminList);
adminUsersRouter.get("/:id", validate({ params: userIdParam }), controller.adminGet);
adminUsersRouter.patch("/:id", validate({ params: userIdParam, body: adminUpdateUserSchema }), controller.adminUpdate);
adminUsersRouter.post("/:id/ban", validate({ params: userIdParam, body: banUserSchema }), controller.adminBan);
adminUsersRouter.post("/:id/unban", validate({ params: userIdParam }), controller.adminUnban);
adminUsersRouter.post("/:id/revoke-sessions", validate({ params: userIdParam }), controller.adminRevokeSessions);
adminUsersRouter.delete("/:id", validate({ params: userIdParam }), controller.adminRemove);
