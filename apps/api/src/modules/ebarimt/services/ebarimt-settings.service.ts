import { StatusCodes } from "http-status-codes";
import { AppError } from "../../../common/errors/app-error.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../infrastructure/database/postgres/prisma.js";
import {
  EbarimtConfigRepository,
  type EbarimtConfigRecord
} from "../repositories/ebarimt-config.repository.js";
import type { EbarimtBillType, EbarimtTaxType, PosApiEnvironment } from "../types/posapi.types.js";

export interface EffectiveEbarimtConfig extends Omit<EbarimtConfigRecord, "createdAt" | "updatedAt"> {
  branchId: string;
  tenantId: string;
  merchantName: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
}

function sanitizeBaseUrl(value: string): string {
  return value.trim().replace(/\/$/, "");
}

function sanitizeCode(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export class EbarimtSettingsService {
  static async getEffectiveConfig(input: { tenantId: string; branchId: string }): Promise<EffectiveEbarimtConfig> {
    const [branch, existing] = await Promise.all([
      prisma.branch.findFirst({
        where: {
          id: input.branchId,
          tenantId: input.tenantId
        },
        include: {
          tenant: true
        }
      }),
      EbarimtConfigRepository.findByBranch(input.tenantId, input.branchId)
    ]);

    if (!branch) {
      throw new AppError("Branch not found", StatusCodes.NOT_FOUND, "BRANCH_NOT_FOUND");
    }

    const config: EffectiveEbarimtConfig = {
      tenantId: input.tenantId,
      branchId: input.branchId,
      enabled: existing?.enabled ?? false,
      environment: (existing?.environment ?? "staging") as PosApiEnvironment,
      posApiBaseUrl: sanitizeBaseUrl(existing?.posApiBaseUrl ?? env.EBARIMT_POSAPI_DEFAULT_URL),
      merchantTin: sanitizeCode(
        existing?.merchantTin ?? env.EBARIMT_DEFAULT_MERCHANT_TIN,
        ""
      ),
      branchNo: sanitizeCode(existing?.branchNo ?? "001", "001"),
      posNo: sanitizeCode(existing?.posNo ?? "001", "001"),
      districtCode: sanitizeCode(existing?.districtCode ?? "0101", "0101"),
      defaultBillType: (existing?.defaultBillType ?? "B2C_RECEIPT") as EbarimtBillType,
      defaultTaxType: (existing?.defaultTaxType ?? "VAT_ABLE") as EbarimtTaxType,
      billIdSuffix: sanitizeCode(existing?.billIdSuffix ?? "01", "01"),
      fallbackClassificationCode: sanitizeCode(existing?.fallbackClassificationCode ?? "0000000", "0000000"),
      defaultMeasureUnit: sanitizeCode(existing?.defaultMeasureUnit ?? "ширхэг", "ширхэг"),
      barCodeType: (existing?.barCodeType ?? "UNDEFINED") as "GS1" | "UNDEFINED",
      autoSendDataAfterIssue: existing?.autoSendDataAfterIssue ?? env.EBARIMT_AUTO_SEND_DATA,
      strictMode: existing?.strictMode ?? env.EBARIMT_STRICT_MODE,
      timeoutMs: existing?.timeoutMs ?? env.EBARIMT_REQUEST_TIMEOUT_MS,
      retryCount: existing?.retryCount ?? 1,
      storeSensitiveFields: existing?.storeSensitiveFields ?? true,
      xApiKey: existing?.xApiKey ?? "",
      merchantName: sanitizeCode(existing?.merchantName ?? branch.tenant.name, branch.tenant.name),
      branchName: sanitizeCode(existing?.branchName ?? branch.name, branch.name),
      branchAddress: sanitizeCode(existing?.branchAddress ?? (branch.address ?? ""), ""),
      branchPhone: sanitizeCode(existing?.branchPhone ?? (branch.phone ?? ""), ""),
      logoUrl: sanitizeCode(existing?.logoUrl ?? "", ""),
      createdById: existing?.createdById,
      updatedById: existing?.updatedById
    };

    return config;
  }

  static async updateConfig(input: {
    tenantId: string;
    branchId: string;
    updatedById: string;
    patch: Partial<
      Pick<
        EbarimtConfigRecord,
        | "enabled"
        | "environment"
        | "posApiBaseUrl"
        | "merchantTin"
        | "branchNo"
        | "posNo"
        | "districtCode"
        | "defaultBillType"
        | "defaultTaxType"
        | "billIdSuffix"
        | "fallbackClassificationCode"
        | "defaultMeasureUnit"
        | "barCodeType"
        | "autoSendDataAfterIssue"
        | "strictMode"
        | "timeoutMs"
        | "retryCount"
        | "storeSensitiveFields"
        | "xApiKey"
        | "merchantName"
        | "branchName"
        | "branchAddress"
        | "branchPhone"
        | "logoUrl"
      >
    >;
  }): Promise<EffectiveEbarimtConfig> {
    const branch = await prisma.branch.findFirst({
      where: {
        id: input.branchId,
        tenantId: input.tenantId
      }
    });

    if (!branch) {
      throw new AppError("Branch not found", StatusCodes.NOT_FOUND, "BRANCH_NOT_FOUND");
    }

    const sanitizedPatch: Partial<EbarimtConfigRecord> = {
      ...input.patch,
      posApiBaseUrl: input.patch.posApiBaseUrl
        ? sanitizeBaseUrl(input.patch.posApiBaseUrl)
        : undefined,
      merchantTin: input.patch.merchantTin?.trim(),
      branchNo: input.patch.branchNo?.trim(),
      posNo: input.patch.posNo?.trim(),
      districtCode: input.patch.districtCode?.trim(),
      billIdSuffix: input.patch.billIdSuffix?.trim(),
      fallbackClassificationCode: input.patch.fallbackClassificationCode?.trim(),
      defaultMeasureUnit: input.patch.defaultMeasureUnit?.trim(),
      xApiKey: input.patch.xApiKey?.trim(),
      merchantName: input.patch.merchantName?.trim(),
      branchName: input.patch.branchName?.trim(),
      branchAddress: input.patch.branchAddress?.trim(),
      branchPhone: input.patch.branchPhone?.trim(),
      logoUrl: input.patch.logoUrl?.trim()
    };

    await EbarimtConfigRepository.upsert({
      tenantId: input.tenantId,
      branchId: input.branchId,
      updatedById: input.updatedById,
      ...sanitizedPatch
    });

    return this.getEffectiveConfig({ tenantId: input.tenantId, branchId: input.branchId });
  }
}
