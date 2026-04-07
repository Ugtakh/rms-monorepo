import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../../common/utils/async-handler.js";
import { AppError } from "../../../common/errors/app-error.js";
import { TenantService } from "../services/tenant.service.js";

const createTenantSchema = z.object({
  code: z.string().min(2).max(40),
  name: z.string().min(2).max(120)
});

export class TenantController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED, "UNAUTHORIZED");
    }

    const data = await TenantService.listForUser({
      isSuperAdmin: req.auth.isSuperAdmin,
      tenantId: req.auth.tenantId
    });

    res.status(StatusCodes.OK).json({ data });
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.isSuperAdmin) {
      throw new AppError("Only super admin can create tenants", StatusCodes.FORBIDDEN, "FORBIDDEN");
    }

    const parsed = createTenantSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid tenant payload", StatusCodes.BAD_REQUEST, "VALIDATION_ERROR", parsed.error.format());
    }

    const created = await TenantService.create(parsed.data);

    res.status(StatusCodes.CREATED).json({ data: created });
  });

  static current = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED, "UNAUTHORIZED");
    }

    const tenantId = req.header("x-tenant-id") ?? req.auth.tenantId;

    if (!tenantId) {
      throw new AppError("Tenant context required", StatusCodes.BAD_REQUEST, "TENANT_REQUIRED");
    }

    const tenant = await TenantService.getById(tenantId);
    res.status(StatusCodes.OK).json({ data: tenant });
  });
}
