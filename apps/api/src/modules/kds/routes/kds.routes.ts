import { Router } from "express";
import { PERMISSIONS } from "@rms/shared";
import { KdsController } from "../controllers/kds.controller.js";
import { authMiddleware } from "../../../common/middleware/auth.middleware.js";
import { tenantScopeMiddleware } from "../../../common/middleware/tenant.middleware.js";
import { requirePermissions } from "../../../common/middleware/rbac.middleware.js";

export const kdsRouter = Router();

kdsRouter.use(authMiddleware, tenantScopeMiddleware);

kdsRouter.get("/", requirePermissions(PERMISSIONS.KDS_READ), KdsController.list);
kdsRouter.patch("/:id/status", requirePermissions(PERMISSIONS.KDS_WRITE), KdsController.updateStatus);
