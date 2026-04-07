import { Router } from "express";
import { PERMISSIONS } from "@rms/shared";
import { PaymentsController } from "../controllers/payments.controller.js";
import { authMiddleware } from "../../../common/middleware/auth.middleware.js";
import { tenantScopeMiddleware } from "../../../common/middleware/tenant.middleware.js";
import { requirePermissions } from "../../../common/middleware/rbac.middleware.js";

export const paymentsRouter = Router();

paymentsRouter.use(authMiddleware, tenantScopeMiddleware);

paymentsRouter.post("/", requirePermissions(PERMISSIONS.PAYMENT_WRITE), PaymentsController.create);
