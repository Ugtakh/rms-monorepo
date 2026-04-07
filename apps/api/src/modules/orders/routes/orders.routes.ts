import { Router } from "express";
import { PERMISSIONS } from "@rms/shared";
import { OrdersController } from "../controllers/orders.controller.js";
import { authMiddleware } from "../../../common/middleware/auth.middleware.js";
import { tenantScopeMiddleware } from "../../../common/middleware/tenant.middleware.js";
import { requirePermissions } from "../../../common/middleware/rbac.middleware.js";

export const ordersRouter = Router();

ordersRouter.use(authMiddleware, tenantScopeMiddleware);

ordersRouter.get("/", requirePermissions(PERMISSIONS.ORDER_READ), OrdersController.list);
ordersRouter.post("/", requirePermissions(PERMISSIONS.ORDER_WRITE), OrdersController.create);
ordersRouter.patch(
  "/:id/status",
  requirePermissions(PERMISSIONS.ORDER_WRITE),
  OrdersController.updateStatus
);
