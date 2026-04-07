import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../../common/utils/async-handler.js";
import { AppError } from "../../../common/errors/app-error.js";
import { getTenantContext, resolveBranchId, resolveTenantId } from "../../../common/utils/scope.js";
import { PaymentsRepository } from "../../payments/repositories/payments.repository.js";
import { EbarimtService } from "../services/ebarimt.service.js";

const updateConfigSchema = z.object({
  enabled: z.boolean().optional(),
  environment: z.enum(["staging", "production"]).optional(),
  posApiBaseUrl: z.string().url().optional(),
  merchantTin: z.string().optional(),
  branchNo: z.string().optional(),
  posNo: z.string().optional(),
  districtCode: z.string().optional(),
  defaultBillType: z.enum(["B2C_RECEIPT", "B2B_RECEIPT", "B2C_INVOICE", "B2B_INVOICE"]).optional(),
  defaultTaxType: z.enum(["VAT_ABLE", "VAT_FREE", "VAT_ZERO", "NOT_VAT"]).optional(),
  billIdSuffix: z.string().optional(),
  fallbackClassificationCode: z.string().optional(),
  defaultMeasureUnit: z.string().optional(),
  barCodeType: z.enum(["GS1", "UNDEFINED"]).optional(),
  autoSendDataAfterIssue: z.boolean().optional(),
  strictMode: z.boolean().optional(),
  timeoutMs: z.number().int().min(1000).max(60000).optional(),
  retryCount: z.number().int().min(0).max(3).optional(),
  storeSensitiveFields: z.boolean().optional(),
  xApiKey: z.string().optional(),
  merchantName: z.string().optional(),
  branchName: z.string().optional(),
  branchAddress: z.string().optional(),
  branchPhone: z.string().optional(),
  logoUrl: z.string().optional()
});

const issueSchema = z
  .object({
    orderId: z.string().min(1),
    amount: z.number().positive(),
    method: z.enum(["CASH", "CARD", "SOCIALPAY", "QPAY", "POCKET", "BANK_TRANSFER"]),
    customer: z
      .object({
        customerType: z.enum(["PERSONAL", "ORGANIZATION"]),
        customerName: z.string().optional(),
        customerTin: z.string().optional(),
        customerPhone: z.string().optional()
      })
      .optional()
  })
  .superRefine((value, ctx) => {
    if (value.customer?.customerType === "ORGANIZATION") {
      if (!value.customer.customerName || value.customer.customerName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "customer.customerName is required for organization"
        });
      }

      if (!value.customer.customerTin || value.customer.customerTin.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "customer.customerTin is required for organization"
        });
      }
    }
  });

const voidSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(8)
});

const saveMerchantsSchema = z.object({
  posNo: z.string().min(1),
  merchantTins: z.array(z.string().min(1)).min(1),
  xApiKey: z.string().optional()
});

export class EbarimtController {
  static getConfig = asyncHandler(async (req: Request, res: Response) => {
    const data = await EbarimtService.getConfig(resolveTenantId(req), resolveBranchId(req));
    res.status(StatusCodes.OK).json({ data });
  });

  static updateConfig = asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateConfigSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(
        "Invalid ebarimt config payload",
        StatusCodes.BAD_REQUEST,
        "VALIDATION_ERROR",
        parsed.error.format()
      );
    }

    const ctx = getTenantContext(req);

    const data = await EbarimtService.updateConfig({
      tenantId: resolveTenantId(req),
      branchId: resolveBranchId(req),
      updatedById: ctx.userId,
      patch: parsed.data
    });

    res.status(StatusCodes.OK).json({ data });
  });

  static issue = asyncHandler(async (req: Request, res: Response) => {
    const parsed = issueSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid issue payload", StatusCodes.BAD_REQUEST, "VALIDATION_ERROR", parsed.error.format());
    }

    const tenantId = resolveTenantId(req);
    const branchId = resolveBranchId(req);

    const order = await PaymentsRepository.getOrderSnapshot({
      tenantId,
      branchId,
      orderId: parsed.data.orderId
    });

    if (!order) {
      throw new AppError("Order not found", StatusCodes.NOT_FOUND, "ORDER_NOT_FOUND");
    }

    const data = await EbarimtService.issueFromPayment({
      tenantId,
      branchId,
      order,
      amount: parsed.data.amount,
      method: parsed.data.method,
      customer: parsed.data.customer
    });

    res.status(StatusCodes.OK).json({ data });
  });

  static voidReceipt = asyncHandler(async (req: Request, res: Response) => {
    const parsed = voidSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(
        "Invalid void payload",
        StatusCodes.BAD_REQUEST,
        "VALIDATION_ERROR",
        parsed.error.format()
      );
    }

    const data = await EbarimtService.voidReceipt({
      tenantId: resolveTenantId(req),
      branchId: resolveBranchId(req),
      id: parsed.data.id,
      date: parsed.data.date
    });

    res.status(StatusCodes.OK).json({ data });
  });

  static getPosInfo = asyncHandler(async (req: Request, res: Response) => {
    const data = await EbarimtService.getPosInfo({
      tenantId: resolveTenantId(req),
      branchId: resolveBranchId(req)
    });

    res.status(StatusCodes.OK).json({ data });
  });

  static sendData = asyncHandler(async (req: Request, res: Response) => {
    const data = await EbarimtService.sendData({
      tenantId: resolveTenantId(req),
      branchId: resolveBranchId(req)
    });

    res.status(StatusCodes.OK).json({ data });
  });

  static getBankAccounts = asyncHandler(async (req: Request, res: Response) => {
    const tin = typeof req.query.tin === "string" ? req.query.tin.trim() : "";

    if (!tin) {
      throw new AppError("tin query is required", StatusCodes.BAD_REQUEST, "VALIDATION_ERROR");
    }

    const data = await EbarimtService.getBankAccounts({
      tenantId: resolveTenantId(req),
      branchId: resolveBranchId(req),
      tin
    });

    res.status(StatusCodes.OK).json({ data });
  });

  static getDistrictCodes = asyncHandler(async (req: Request, res: Response) => {
    const data = await EbarimtService.getDistrictCodes({
      tenantId: resolveTenantId(req),
      branchId: resolveBranchId(req)
    });

    res.status(StatusCodes.OK).json({ data });
  });

  static getTinByRegNo = asyncHandler(async (req: Request, res: Response) => {
    const regNo = typeof req.query.regNo === "string" ? req.query.regNo.trim() : "";

    if (!regNo) {
      throw new AppError("regNo query is required", StatusCodes.BAD_REQUEST, "VALIDATION_ERROR");
    }

    const data = await EbarimtService.getTinByRegNo({
      tenantId: resolveTenantId(req),
      branchId: resolveBranchId(req),
      regNo
    });

    res.status(StatusCodes.OK).json({ data });
  });

  static getTaxpayerInfo = asyncHandler(async (req: Request, res: Response) => {
    const tin = typeof req.query.tin === "string" ? req.query.tin.trim() : "";

    if (!tin) {
      throw new AppError("tin query is required", StatusCodes.BAD_REQUEST, "VALIDATION_ERROR");
    }

    const data = await EbarimtService.getTaxpayerInfo({
      tenantId: resolveTenantId(req),
      branchId: resolveBranchId(req),
      tin
    });

    res.status(StatusCodes.OK).json({ data });
  });

  static getProductTaxCodes = asyncHandler(async (req: Request, res: Response) => {
    const data = await EbarimtService.getProductTaxCodes({
      tenantId: resolveTenantId(req),
      branchId: resolveBranchId(req)
    });

    res.status(StatusCodes.OK).json({ data });
  });

  static saveOperatorMerchants = asyncHandler(async (req: Request, res: Response) => {
    const parsed = saveMerchantsSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(
        "Invalid save merchants payload",
        StatusCodes.BAD_REQUEST,
        "VALIDATION_ERROR",
        parsed.error.format()
      );
    }

    const data = await EbarimtService.saveOperatorMerchants({
      tenantId: resolveTenantId(req),
      branchId: resolveBranchId(req),
      posNo: parsed.data.posNo,
      merchantTins: parsed.data.merchantTins,
      xApiKey: parsed.data.xApiKey
    });

    res.status(StatusCodes.OK).json({ data });
  });
}
