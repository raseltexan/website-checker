import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { settingKeyParam } from "../settings/settings.validation.js";
import * as controller from "./admin.controller.js";
import { emailLogQuery, sessionIdParam, testEmailSchema } from "./admin.validation.js";
import { adminUsersRouter } from "../users/users.routes.js";
import { adminWebsitesRouter } from "../websites/websites.routes.js";
import { adminScansRouter } from "../scans/scans.routes.js";
import { adminReportsRouter } from "../reports/reports.routes.js";
import { adminCheckersRouter } from "../checkers/checkers.routes.js";
import { adminPlansRouter } from "../plans/plans.routes.js";
import { adminSubscriptionsRouter } from "../billing/billing.routes.js";
import { adminNotificationsRouter } from "../notifications/notifications.routes.js";
import { adminActivityRouter } from "../activity/activity.routes.js";

export const adminRouter = Router();
adminRouter.use(requireAdmin);

adminRouter.get("/overview", controller.overview);
adminRouter.get("/system-health", controller.systemHealth);
adminRouter.get("/security", controller.security);
adminRouter.delete("/security/sessions/:id", validate({ params: sessionIdParam }), controller.revokeSession);
adminRouter.get("/email", controller.emailOverview);
adminRouter.get("/email/logs", validate({ query: emailLogQuery }), controller.emailLogs);
adminRouter.post("/email/test", validate({ body: testEmailSchema }), controller.testEmail);
adminRouter.get("/browser-testing", controller.browserTesting);
adminRouter.get("/settings", controller.getSettings);
adminRouter.patch("/settings/:key", validate({ params: settingKeyParam }), controller.updateSettings);

adminRouter.use("/users", adminUsersRouter);
adminRouter.use("/websites", adminWebsitesRouter);
adminRouter.use("/scans", adminScansRouter);
adminRouter.use("/reports", adminReportsRouter);
adminRouter.use("/checkers", adminCheckersRouter);
adminRouter.use("/plans", adminPlansRouter);
adminRouter.use("/subscriptions", adminSubscriptionsRouter);
adminRouter.use("/notifications", adminNotificationsRouter);
adminRouter.use("/activity-logs", adminActivityRouter);
