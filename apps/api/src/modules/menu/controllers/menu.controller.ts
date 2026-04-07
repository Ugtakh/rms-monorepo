import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../../common/utils/async-handler.js";
import { AppError } from "../../../common/errors/app-error.js";
import { resolveBranchId, resolveParamId, resolveTenantId } from "../../../common/utils/scope.js";
import { MenuService } from "../services/menu.service.js";

const createMenuItemSchema = z.object({
  category: z.string().min(2),
  sku: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  available: z.boolean().optional(),
  prepStation: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isSeasonal: z.boolean().optional(),
  seasonStartDate: z.string().datetime().optional(),
  seasonEndDate: z.string().datetime().optional(),
  serviceWindows: z
    .array(
      z.object({
        label: z.string().min(1).optional(),
        daysOfWeek: z.array(z.number().int().min(1).max(7)).min(1),
        startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        enabled: z.boolean().optional()
      })
    )
    .optional(),
  ingredients: z
    .array(
      z.object({
        inventoryItemId: z.string().min(1),
        inventoryItemName: z.string().min(1),
        quantity: z.number().positive(),
        unit: z.string().min(1),
        wastePercent: z.number().min(0).max(100).optional()
      })
    )
    .optional()
});

const updateMenuItemSchema = z
  .object({
    category: z.string().min(2).optional(),
    sku: z.string().min(2).optional(),
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    available: z.boolean().optional(),
    prepStation: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isSeasonal: z.boolean().optional(),
    seasonStartDate: z.string().datetime().optional(),
    seasonEndDate: z.string().datetime().optional(),
    serviceWindows: z
      .array(
        z.object({
          label: z.string().min(1).optional(),
          daysOfWeek: z.array(z.number().int().min(1).max(7)).min(1),
          startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
          endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
          enabled: z.boolean().optional()
        })
      )
      .optional(),
    ingredients: z
      .array(
        z.object({
          inventoryItemId: z.string().min(1),
          inventoryItemName: z.string().min(1),
          quantity: z.number().positive(),
          unit: z.string().min(1),
          wastePercent: z.number().min(0).max(100).optional()
        })
      )
      .optional()
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field is required"
  });

const updateAvailabilitySchema = z.object({
  available: z.boolean()
});

export class MenuController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = resolveTenantId(req);
    const branchId = resolveBranchId(req);

    const data = await MenuService.list(tenantId, branchId);

    res.status(StatusCodes.OK).json({ data });
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const parsed = createMenuItemSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid menu payload", StatusCodes.BAD_REQUEST, "VALIDATION_ERROR", parsed.error.format());
    }

    const tenantId = resolveTenantId(req);
    const branchId = resolveBranchId(req);

    const data = await MenuService.create({
      tenantId,
      branchId,
      ...parsed.data
    });

    res.status(StatusCodes.CREATED).json({ data });
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateMenuItemSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid menu payload", StatusCodes.BAD_REQUEST, "VALIDATION_ERROR", parsed.error.format());
    }

    const tenantId = resolveTenantId(req);
    const branchId = resolveBranchId(req);

    const data = await MenuService.update({
      tenantId,
      branchId,
      id: resolveParamId(req),
      ...parsed.data
    });

    if (!data) {
      throw new AppError("Menu item not found", StatusCodes.NOT_FOUND, "MENU_NOT_FOUND");
    }

    res.status(StatusCodes.OK).json({ data });
  });

  static updateAvailability = asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateAvailabilitySchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid payload", StatusCodes.BAD_REQUEST, "VALIDATION_ERROR", parsed.error.format());
    }

    const tenantId = resolveTenantId(req);
    const branchId = resolveBranchId(req);

    const data = await MenuService.updateAvailability({
      tenantId,
      branchId,
      id: resolveParamId(req),
      available: parsed.data.available
    });

    if (!data) {
      throw new AppError("Menu item not found", StatusCodes.NOT_FOUND, "MENU_NOT_FOUND");
    }

    res.status(StatusCodes.OK).json({ data });
  });
}
