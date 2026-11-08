import { Router, type Request, type Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import { getSetting } from "./settings.service.js";

/** Non-sensitive settings the public UI needs (e.g. whether sign-up is open). */
const publicSettings = async (_req: Request, res: Response) => {
  const { siteName, allowRegistration, maintenanceMode, supportEmail } = await getSetting("general");
  sendResponse(res, { data: { siteName, allowRegistration, maintenanceMode, supportEmail } });
};

export const publicSettingsRouter = Router();
publicSettingsRouter.get("/", publicSettings);
