import { Router } from "express";
import { PERMISSIONS } from "@rms/shared";
import { ReportsController } from "../controllers/reports.controller.js";
import { authMiddleware } from "../../../common/middleware/auth.middleware.js";
import { tenantScopeMiddleware } from "../../../common/middleware/tenant.middleware.js";
import { requirePermissions } from "../../../common/middleware/rbac.middleware.js";

export const reportsRouter = Router();

reportsRouter.use(authMiddleware, tenantScopeMiddleware);

reportsRouter.get("/summary", requirePermissions(PERMISSIONS.REPORT_READ), ReportsController.summary);
