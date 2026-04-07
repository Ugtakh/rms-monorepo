import { StatusCodes } from "http-status-codes";
import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../errors/app-error.js";

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.header("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED, "UNAUTHORIZED"));
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const payload = verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      branchId: payload.branchId,
      permissions: payload.permissions,
      isSuperAdmin: payload.isSuperAdmin,
      roles: payload.roles
    };
    next();
  } catch {
    next(new AppError("Invalid access token", StatusCodes.UNAUTHORIZED, "INVALID_TOKEN"));
  }
};
