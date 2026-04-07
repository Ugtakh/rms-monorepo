import { EbarimtConfigModel } from "../schemas/ebarimt-config.schema.js";
import type { EbarimtBillType, EbarimtTaxType, PosApiEnvironment } from "../types/posapi.types.js";

export interface EbarimtConfigRecord {
  tenantId: string;
  branchId: string;
  enabled: boolean;
  environment: PosApiEnvironment;
  posApiBaseUrl: string;
  merchantTin: string;
  branchNo: string;
  posNo: string;
  districtCode: string;
  defaultBillType: EbarimtBillType;
  defaultTaxType: EbarimtTaxType;
  billIdSuffix: string;
  fallbackClassificationCode: string;
  defaultMeasureUnit: string;
  barCodeType: "GS1" | "UNDEFINED";
  autoSendDataAfterIssue: boolean;
  strictMode: boolean;
  timeoutMs: number;
  retryCount: number;
  storeSensitiveFields: boolean;
  xApiKey: string;
  merchantName: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  logoUrl: string;
  createdById?: string;
  updatedById?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class EbarimtConfigRepository {
  static async findByBranch(tenantId: string, branchId: string): Promise<EbarimtConfigRecord | null> {
    const doc = await EbarimtConfigModel.findOne({ tenantId, branchId }).lean();
    return doc as EbarimtConfigRecord | null;
  }

  static async upsert(
    input: Partial<EbarimtConfigRecord> & { tenantId: string; branchId: string; updatedById: string }
  ): Promise<EbarimtConfigRecord> {
    const updated = await EbarimtConfigModel.findOneAndUpdate(
      {
        tenantId: input.tenantId,
        branchId: input.branchId
      },
      {
        $set: {
          ...input,
          updatedById: input.updatedById
        },
        $setOnInsert: {
          createdById: input.updatedById
        }
      },
      {
        upsert: true,
        new: true
      }
    ).lean();

    return updated as EbarimtConfigRecord;
  }
}
