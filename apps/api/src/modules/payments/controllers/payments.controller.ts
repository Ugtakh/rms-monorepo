import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../../common/utils/async-handler.js";
import { AppError } from "../../../common/errors/app-error.js";
import { getTenantContext, resolveBranchId, resolveTenantId } from "../../../common/utils/scope.js";
import { PaymentsService } from "../services/payments.service.js";

const createPaymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive(),
  method: z.enum(["CASH", "CARD", "SOCIALPAY", "QPAY", "POCKET", "BANK_TRANSFER"]),
  externalRef: z.string().optional(),
  ebarimt: z
    .object({
      customerType: z.enum(["PERSONAL", "ORGANIZATION"]),
      customerName: z.string().optional(),
      customerTin: z.string().optional(),
      customerPhone: z.string().optional()
    })
    .optional(),
  payload: z.record(z.string(), z.unknown()).optional()
}).superRefine((input, ctx) => {
  if (input.ebarimt?.customerType === "ORGANIZATION") {
    if (!input.ebarimt.customerName || input.ebarimt.customerName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Organization customerName is required"
      });
    }

    if (!input.ebarimt.customerTin || input.ebarimt.customerTin.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Organization customerTin is required"
      });
    }
  }
});

export class PaymentsController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const parsed = createPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid payment payload", StatusCodes.BAD_REQUEST, "VALIDATION_ERROR", parsed.error.format());
    }

    const ctx = getTenantContext(req);

    const data = await PaymentsService.pay({
      ...parsed.data,
      tenantId: resolveTenantId(req),
      branchId: resolveBranchId(req),
      createdById: ctx.userId
    });

    res.status(StatusCodes.CREATED).json({ data });
  });
}
