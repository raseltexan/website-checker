import { Router } from "express";
import { requireAuth } from "./middlewares/auth.js";
import { maintenanceGuard } from "./middlewares/maintenance.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { websitesRouter } from "./modules/websites/websites.routes.js";
import { scansRouter } from "./modules/scans/scans.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { checkersRouter } from "./modules/checkers/checkers.routes.js";
import { plansRouter } from "./modules/plans/plans.routes.js";
import { billingRouter } from "./modules/billing/billing.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";
import { activityRouter } from "./modules/activity/activity.routes.js";
import { publicSettingsRouter } from "./modules/settings/settings.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";

export const apiRouter = Router();

// Public
apiRouter.use("/settings/public", publicSettingsRouter);
apiRouter.use("/plans", plansRouter);

// Admin (has its own auth + role guard)
apiRouter.use("/admin", adminRouter);

// Authenticated user routes
const userRoutes = Router();
userRoutes.use(requireAuth, maintenanceGuard);
userRoutes.use("/users", usersRouter);
userRoutes.use("/websites", websitesRouter);
userRoutes.use("/scans", scansRouter);
userRoutes.use("/reports", reportsRouter);
userRoutes.use("/checkers", checkersRouter);
userRoutes.use("/billing", billingRouter);
userRoutes.use("/notifications", notificationsRouter);
userRoutes.use("/activity", activityRouter);
apiRouter.use(userRoutes);
