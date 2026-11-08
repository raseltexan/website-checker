import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { idParam } from "../../utils/validation.js";
import * as controller from "./websites.controller.js";
import { createWebsiteSchema, updateWebsiteSchema, websiteListQuery } from "./websites.validation.js";

export const websitesRouter = Router();
websitesRouter.get("/", validate({ query: websiteListQuery }), controller.list);
websitesRouter.post("/", validate({ body: createWebsiteSchema }), controller.create);
websitesRouter.get("/:id", validate({ params: idParam }), controller.get);
websitesRouter.patch("/:id", validate({ params: idParam, body: updateWebsiteSchema }), controller.update);
websitesRouter.delete("/:id", validate({ params: idParam }), controller.remove);

export const adminWebsitesRouter = Router();
adminWebsitesRouter.get("/", validate({ query: websiteListQuery }), controller.adminList);
adminWebsitesRouter.delete("/:id", validate({ params: idParam }), controller.adminRemove);
