import { Router } from "express";
import { PERMISSIONS } from "@rms/shared";
import { authMiddleware } from "../../../common/middleware/auth.middleware.js";
import { tenantScopeMiddleware } from "../../../common/middleware/tenant.middleware.js";
import { requirePermissions } from "../../../common/middleware/rbac.middleware.js";
import { EbarimtController } from "../controllers/ebarimt.controller.js";

export const ebarimtRouter = Router();

ebarimtRouter.use(authMiddleware, tenantScopeMiddleware);

ebarimtRouter.get("/config", requirePermissions(PERMISSIONS.PAYMENT_READ), EbarimtController.getConfig);
ebarimtRouter.put("/config", requirePermissions(PERMISSIONS.BRANCH_WRITE), EbarimtController.updateConfig);

ebarimtRouter.post("/issue", requirePermissions(PERMISSIONS.PAYMENT_WRITE), EbarimtController.issue);
ebarimtRouter.post("/void", requirePermissions(PERMISSIONS.PAYMENT_WRITE), EbarimtController.voidReceipt);

ebarimtRouter.get("/pos/info", requirePermissions(PERMISSIONS.PAYMENT_READ), EbarimtController.getPosInfo);
ebarimtRouter.post("/pos/send-data", requirePermissions(PERMISSIONS.PAYMENT_WRITE), EbarimtController.sendData);
ebarimtRouter.get(
  "/pos/bank-accounts",
  requirePermissions(PERMISSIONS.PAYMENT_READ),
  EbarimtController.getBankAccounts
);

ebarimtRouter.get("/refs/district-codes", requirePermissions(PERMISSIONS.BRANCH_READ), EbarimtController.getDistrictCodes);
ebarimtRouter.get("/refs/tin-by-regno", requirePermissions(PERMISSIONS.BRANCH_READ), EbarimtController.getTinByRegNo);
ebarimtRouter.get("/refs/taxpayer-info", requirePermissions(PERMISSIONS.BRANCH_READ), EbarimtController.getTaxpayerInfo);
ebarimtRouter.get(
  "/refs/product-tax-codes",
  requirePermissions(PERMISSIONS.BRANCH_READ),
  EbarimtController.getProductTaxCodes
);

ebarimtRouter.post(
  "/operator/save-merchants",
  requirePermissions(PERMISSIONS.BRANCH_WRITE),
  EbarimtController.saveOperatorMerchants
);
