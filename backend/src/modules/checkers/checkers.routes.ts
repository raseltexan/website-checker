import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { idParam } from "../../utils/validation.js";
import * as controller from "./checkers.controller.js";
import { updateCategorySchema, updateCheckSchema } from "./checkers.validation.js";

export const checkersRouter = Router();
checkersRouter.get("/", controller.listEnabled);

export const adminCheckersRouter = Router();
adminCheckersRouter.get("/", controller.listAll);
adminCheckersRouter.patch("/categories/:id", validate({ params: idParam, body: updateCategorySchema }), controller.updateCategory);
adminCheckersRouter.patch("/checks/:id", validate({ params: idParam, body: updateCheckSchema }), controller.updateCheck);
