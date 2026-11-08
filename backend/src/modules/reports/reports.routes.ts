import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { listQuerySchema } from "../../utils/query.js";
import { idParam } from "../../utils/validation.js";
import * as controller from "./reports.controller.js";

export const reportsRouter = Router();
reportsRouter.get("/", validate({ query: listQuerySchema }), controller.list);
reportsRouter.get("/:id", validate({ params: idParam }), controller.get);
reportsRouter.delete("/:id", validate({ params: idParam }), controller.remove);

export const adminReportsRouter = Router();
adminReportsRouter.get("/", validate({ query: listQuerySchema }), controller.adminList);
adminReportsRouter.get("/:id", validate({ params: idParam }), controller.adminGet);
adminReportsRouter.delete("/:id", validate({ params: idParam }), controller.adminRemove);
