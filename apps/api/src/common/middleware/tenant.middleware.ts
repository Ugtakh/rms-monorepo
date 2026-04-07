import { StatusCodes } from "http-status-codes";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";

export const tenantScopeMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.auth) {
    next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED, "UNAUTHORIZED"));
    return;
  }

  if (req.auth.isSuperAdmin) {
    next();
    return;
  }

  const tenantIdHeader = req.header("x-tenant-id");
  const branchIdHeader = req.header("x-branch-id");

  if (tenantIdHeader && tenantIdHeader !== req.auth.tenantId) {
    next(new AppError("Cross-tenant access denied", StatusCodes.FORBIDDEN, "TENANT_SCOPE_VIOLATION"));
    return;
  }

  if (branchIdHeader && req.auth.branchId && branchIdHeader !== req.auth.branchId) {
    next(new AppError("Cross-branch access denied", StatusCodes.FORBIDDEN, "BRANCH_SCOPE_VIOLATION"));
    return;
  }

  next();
};
