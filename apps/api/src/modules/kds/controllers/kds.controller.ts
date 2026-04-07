import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../../common/utils/async-handler.js";
import { AppError } from "../../../common/errors/app-error.js";
import { resolveBranchId, resolveParamId, resolveTenantId } from "../../../common/utils/scope.js";
import { KdsService } from "../services/kds.service.js";

const updateKdsStatusSchema = z.object({
  status: z.enum(["IN_PROGRESS", "READY", "SERVED"])
});

export class KdsController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const data = await KdsService.list({
      tenantId: resolveTenantId(req),
      branchId: resolveBranchId(req),
      status: req.query.status as string | undefined,
      station: req.query.station as string | undefined
    });

    res.status(StatusCodes.OK).json({ data });
  });

  static updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateKdsStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid KDS status payload", StatusCodes.BAD_REQUEST, "VALIDATION_ERROR", parsed.error.format());
    }

    const data = await KdsService.updateStatus({
      tenantId: resolveTenantId(req),
      branchId: resolveBranchId(req),
      id: resolveParamId(req),
      status: parsed.data.status
    });

    res.status(StatusCodes.OK).json({ data });
  });
}
