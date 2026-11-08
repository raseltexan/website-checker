import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { idParam } from "../../utils/validation.js";
import * as controller from "./plans.controller.js";
import { createPlanSchema, updatePlanSchema } from "./plans.validation.js";

export const plansRouter = Router();
plansRouter.get("/", controller.listActive);

export const adminPlansRouter = Router();
adminPlansRouter.get("/", controller.listAll);
adminPlansRouter.post("/", validate({ body: createPlanSchema }), controller.create);
adminPlansRouter.patch("/:id", validate({ params: idParam, body: updatePlanSchema }), controller.update);
adminPlansRouter.delete("/:id", validate({ params: idParam }), controller.remove);
