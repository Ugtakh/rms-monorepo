import { Router } from "express";
import { PERMISSIONS } from "@rms/shared";
import { TenantController } from "../controllers/tenant.controller.js";
import { authMiddleware } from "../../../common/middleware/auth.middleware.js";
import { tenantScopeMiddleware } from "../../../common/middleware/tenant.middleware.js";
import { requirePermissions } from "../../../common/middleware/rbac.middleware.js";

export const tenantRouter = Router();

tenantRouter.use(authMiddleware, tenantScopeMiddleware);

tenantRouter.get("/", requirePermissions(PERMISSIONS.TENANT_READ), TenantController.list);
tenantRouter.get("/current", requirePermissions(PERMISSIONS.TENANT_READ), TenantController.current);
tenantRouter.post("/", requirePermissions(PERMISSIONS.TENANT_WRITE), TenantController.create);
