import { Router } from "express";
import { PERMISSIONS } from "@rms/shared";
import { AuthController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../../../common/middleware/auth.middleware.js";
import { tenantScopeMiddleware } from "../../../common/middleware/tenant.middleware.js";
import { requirePermissions } from "../../../common/middleware/rbac.middleware.js";

export const authRouter = Router();

authRouter.post("/login", AuthController.login);
authRouter.post("/refresh", AuthController.refresh);
authRouter.post("/logout", AuthController.logout);
authRouter.get("/me", authMiddleware, AuthController.me);
authRouter.post(
  "/register-employee",
  authMiddleware,
  tenantScopeMiddleware,
  requirePermissions(PERMISSIONS.USER_WRITE),
  AuthController.registerEmployee
);
