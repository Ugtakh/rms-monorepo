import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../../common/utils/async-handler.js";
import { AppError } from "../../../common/errors/app-error.js";
import { resolveTenantId } from "../../../common/utils/scope.js";
import { BranchService } from "../services/branch.service.js";

const createBranchSchema = z.object({
  tenantId: z.string().optional(),
  code: z.string().min(2).max(20),
  name: z.string().min(2).max(100),
  address: z.string().optional(),
  phone: z.string().optional()
});

export class BranchController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED, "UNAUTHORIZED");
    }

    const tenantId = req.auth.isSuperAdmin
      ? (req.header("x-tenant-id") ?? undefined)
      : resolveTenantId(req);

    const data = await BranchService.list({
      tenantId,
      isSuperAdmin: req.auth.isSuperAdmin
    });

    res.status(StatusCodes.OK).json({ data });
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const parsed = createBranchSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid branch payload", StatusCodes.BAD_REQUEST, "VALIDATION_ERROR", parsed.error.format());
    }

    const tenantId = req.auth?.isSuperAdmin
      ? parsed.data.tenantId ?? req.header("x-tenant-id")
      : resolveTenantId(req);

    if (!tenantId) {
      throw new AppError(
        "tenantId is required for branch creation",
        StatusCodes.BAD_REQUEST,
        "TENANT_REQUIRED"
      );
    }

    const branch = await BranchService.create({
      code: parsed.data.code,
      name: parsed.data.name,
      address: parsed.data.address,
      phone: parsed.data.phone,
      tenantId
    });

    res.status(StatusCodes.CREATED).json({ data: branch });
  });
}
