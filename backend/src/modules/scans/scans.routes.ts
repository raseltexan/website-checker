import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../../middlewares/validate.js";
import { idParam } from "../../utils/validation.js";
import * as controller from "./scans.controller.js";
import { createScanSchema, scanListQuery } from "./scans.validation.js";

/** Per-user burst limit on scan creation (plan quotas are enforced separately). */
const scanCreateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  keyGenerator: (req) => req.user?.id ?? "anonymous",
  message: { success: false, message: "Too many scans started. Please wait a minute." },
});

export const scansRouter = Router();
scansRouter.get("/", validate({ query: scanListQuery }), controller.list);
scansRouter.post("/", scanCreateLimiter, validate({ body: createScanSchema }), controller.create);
scansRouter.get("/:id", validate({ params: idParam }), controller.get);
scansRouter.post("/:id/cancel", validate({ params: idParam }), controller.cancel);
scansRouter.post("/:id/rescan", scanCreateLimiter, validate({ params: idParam }), controller.rescan);
scansRouter.delete("/:id", validate({ params: idParam }), controller.remove);

export const adminScansRouter = Router();
adminScansRouter.get("/", validate({ query: scanListQuery }), controller.adminList);
adminScansRouter.get("/stats", controller.adminStats);
adminScansRouter.get("/:id", validate({ params: idParam }), controller.adminGet);
adminScansRouter.post("/:id/cancel", validate({ params: idParam }), controller.adminCancel);
adminScansRouter.delete("/:id", validate({ params: idParam }), controller.adminRemove);
