import { Router } from "express";
import { PERMISSIONS } from "@rms/shared";
import { InventoryController } from "../controllers/inventory.controller.js";
import { authMiddleware } from "../../../common/middleware/auth.middleware.js";
import { tenantScopeMiddleware } from "../../../common/middleware/tenant.middleware.js";
import { requirePermissions } from "../../../common/middleware/rbac.middleware.js";

export const inventoryRouter = Router();

inventoryRouter.use(authMiddleware, tenantScopeMiddleware);

inventoryRouter.get("/", requirePermissions(PERMISSIONS.INVENTORY_READ), InventoryController.list);
inventoryRouter.post("/", requirePermissions(PERMISSIONS.INVENTORY_WRITE), InventoryController.create);
inventoryRouter.post(
  "/:id/adjust",
  requirePermissions(PERMISSIONS.INVENTORY_WRITE),
  InventoryController.adjust
);
