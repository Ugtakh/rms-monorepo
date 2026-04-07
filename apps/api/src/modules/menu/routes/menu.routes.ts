import { Router } from "express";
import { PERMISSIONS } from "@rms/shared";
import { MenuController } from "../controllers/menu.controller.js";
import { authMiddleware } from "../../../common/middleware/auth.middleware.js";
import { tenantScopeMiddleware } from "../../../common/middleware/tenant.middleware.js";
import { requirePermissions } from "../../../common/middleware/rbac.middleware.js";

export const menuRouter = Router();

menuRouter.use(authMiddleware, tenantScopeMiddleware);

menuRouter.get("/", requirePermissions(PERMISSIONS.MENU_READ), MenuController.list);
menuRouter.post("/", requirePermissions(PERMISSIONS.MENU_WRITE), MenuController.create);
menuRouter.patch("/:id", requirePermissions(PERMISSIONS.MENU_WRITE), MenuController.update);
menuRouter.patch(
  "/:id/availability",
  requirePermissions(PERMISSIONS.MENU_WRITE),
  MenuController.updateAvailability
);
