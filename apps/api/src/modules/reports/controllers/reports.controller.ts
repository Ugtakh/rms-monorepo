import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";
import { asyncHandler } from "../../../common/utils/async-handler.js";
import { resolveTenantId } from "../../../common/utils/scope.js";
import { ReportsService } from "../services/reports.service.js";

export class ReportsController {
  static summary = asyncHandler(async (req: Request, res: Response) => {
    const data = await ReportsService.summary({
      tenantId: resolveTenantId(req),
      branchId: (req.query.branchId as string | undefined) ?? undefined,
      start: (req.query.start as string | undefined) ?? undefined,
      end: (req.query.end as string | undefined) ?? undefined
    });

    res.status(StatusCodes.OK).json({ data });
  });
}
