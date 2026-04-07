import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../../common/utils/async-handler.js";
import { AppError } from "../../../common/errors/app-error.js";
import { resolveBranchId, resolveParamId, resolveTenantId } from "../../../common/utils/scope.js";
import { InventoryService } from "../services/inventory.service.js";

const createInventorySchema = z.object({
  sku: z.string().min(2),
  name: z.string().min(2),
  unit: z.string().min(1),
  onHand: z.number().min(0),
  reorderLevel: z.number().min(0),
  averageCost: z.number().min(0)
});

const adjustInventorySchema = z.object({
  quantity: z.number().positive(),
  movementType: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  unitCost: z.number().min(0).optional(),
  note: z.string().optional()
});

export class InventoryController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const data = await InventoryService.list(resolveTenantId(req), resolveBranchId(req));

    res.status(StatusCodes.OK).json({ data });
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const parsed = createInventorySchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(
        "Invalid inventory payload",
        StatusCodes.BAD_REQUEST,
        "VALIDATION_ERROR",
        parsed.error.format()
      );
    }

    const data = await InventoryService.create({
      tenantId: resolveTenantId(req),
      branchId: resolveBranchId(req),
      ...parsed.data
    });

    res.status(StatusCodes.CREATED).json({ data });
  });

  static adjust = asyncHandler(async (req: Request, res: Response) => {
    const parsed = adjustInventorySchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(
        "Invalid inventory adjustment payload",
        StatusCodes.BAD_REQUEST,
        "VALIDATION_ERROR",
        parsed.error.format()
      );
    }

    const data = await InventoryService.adjust({
      tenantId: resolveTenantId(req),
      branchId: resolveBranchId(req),
      id: resolveParamId(req),
      ...parsed.data
    });

    res.status(StatusCodes.OK).json({ data });
  });
}
