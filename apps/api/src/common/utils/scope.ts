import { StatusCodes } from "http-status-codes";
import type { Request } from "express";
import { AppError } from "../errors/app-error.js";

export const getTenantContext = (req: Request): { tenantId: string; branchId: string | null; userId: string } => {
  if (!req.auth) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED, "UNAUTHORIZED");
  }

  const tenantId = req.header("x-tenant-id") ?? req.auth.tenantId;
  if (!tenantId) {
    throw new AppError("Tenant context missing", StatusCodes.BAD_REQUEST, "TENANT_REQUIRED");
  }

  return {
    tenantId,
    branchId: req.header("x-branch-id") ?? req.auth.branchId,
    userId: req.auth.userId
  };
};

export const resolveTenantId = (req: Request): string => {
  const ctx = getTenantContext(req);
  return ctx.tenantId;
};

export const resolveBranchId = (req: Request): string => {
  const ctx = getTenantContext(req);

  if (!ctx.branchId) {
    throw new AppError("Branch context required", StatusCodes.BAD_REQUEST, "BRANCH_REQUIRED");
  }

  return ctx.branchId;
};

export const resolveParamId = (req: Request, name = "id"): string => {
  const value = (req.params as Record<string, string | string[] | undefined>)[name];

  if (Array.isArray(value)) {
    if (!value[0]) {
      throw new AppError("Invalid route parameter", StatusCodes.BAD_REQUEST, "INVALID_PARAM");
    }
    return value[0];
  }

  if (!value) {
    throw new AppError("Invalid route parameter", StatusCodes.BAD_REQUEST, "INVALID_PARAM");
  }

  return value;
};
