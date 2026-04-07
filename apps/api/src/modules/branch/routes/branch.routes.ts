import { Router } from "express";
import { PERMISSIONS } from "@rms/shared";
import { BranchController } from "../controllers/branch.controller.js";
import { authMiddleware } from "../../../common/middleware/auth.middleware.js";
import { tenantScopeMiddleware } from "../../../common/middleware/tenant.middleware.js";
import { requirePermissions } from "../../../common/middleware/rbac.middleware.js";

export const branchRouter = Router();

branchRouter.use(authMiddleware, tenantScopeMiddleware);

branchRouter.get("/", requirePermissions(PERMISSIONS.BRANCH_READ), BranchController.list);
branchRouter.post("/", requirePermissions(PERMISSIONS.BRANCH_WRITE), BranchController.create);
