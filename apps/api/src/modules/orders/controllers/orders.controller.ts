import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../../common/utils/async-handler.js";
import { AppError } from "../../../common/errors/app-error.js";
import { getTenantContext, resolveBranchId, resolveParamId, resolveTenantId } from "../../../common/utils/scope.js";
import { OrdersService } from "../services/orders.service.js";

const createOrderSchema = z.object({
  tableId: z.string().nullable().optional(),
  guestName: z.string().optional(),
  note: z.string().optional(),
  sendToKitchen: z.boolean().default(true),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        sku: z.string().optional(),
        itemName: z.string().min(1),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        discount: z.number().min(0).optional(),
        note: z.string().optional()
      })
    )
    .min(1)
});

const updateStatusSchema = z.object({
  status: z.enum(["DRAFT", "SUBMITTED", "IN_PROGRESS", "READY", "SERVED", "CLOSED", "CANCELLED"])
});

export class OrdersController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const data = await OrdersService.list(resolveTenantId(req), resolveBranchId(req));

    res.status(StatusCodes.OK).json({ data });
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const parsed = createOrderSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid order payload", StatusCodes.BAD_REQUEST, "VALIDATION_ERROR", parsed.error.format());
    }

    const ctx = getTenantContext(req);

    const data = await OrdersService.create({
      ...parsed.data,
      tenantId: ctx.tenantId,
      branchId: ctx.branchId ?? resolveBranchId(req),
      createdById: ctx.userId,
      tableId: parsed.data.tableId ?? null
    });

    res.status(StatusCodes.CREATED).json({ data });
  });

  static updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid status payload", StatusCodes.BAD_REQUEST, "VALIDATION_ERROR", parsed.error.format());
    }

    const data = await OrdersService.updateStatus({
      id: resolveParamId(req),
      tenantId: resolveTenantId(req),
      branchId: resolveBranchId(req),
      status: parsed.data.status
    });

    res.status(StatusCodes.OK).json({ data });
  });
}
