import { StatusCodes } from "http-status-codes";
import type { NextFunction, Request, Response } from "express";
import type { PermissionCode } from "@rms/shared";
import { PERMISSIONS } from "@rms/shared";
import { AppError } from "../errors/app-error.js";

export const requirePermissions = (...required: PermissionCode[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED, "UNAUTHORIZED"));
      return;
    }

    if (req.auth.isSuperAdmin || req.auth.permissions.includes(PERMISSIONS.SUPER_ADMIN_ALL)) {
      next();
      return;
    }

    const hasAll = required.every((item) => req.auth!.permissions.includes(item));

    if (!hasAll) {
      next(new AppError("Forbidden", StatusCodes.FORBIDDEN, "INSUFFICIENT_PERMISSION"));
      return;
    }

    next();
  };
};
