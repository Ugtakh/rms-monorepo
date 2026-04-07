import mongoose, { Schema, model } from "mongoose";

const ebarimtConfigSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: String, required: true, index: true },

    enabled: { type: Boolean, default: false },
    environment: {
      type: String,
      enum: ["staging", "production"],
      default: "staging"
    },

    posApiBaseUrl: { type: String, default: "http://localhost:7080" },
    merchantTin: { type: String, default: "" },
    branchNo: { type: String, default: "001" },
    posNo: { type: String, default: "001" },
    districtCode: { type: String, default: "0101" },

    defaultBillType: {
      type: String,
      enum: ["B2C_RECEIPT", "B2B_RECEIPT", "B2C_INVOICE", "B2B_INVOICE"],
      default: "B2C_RECEIPT"
    },
    defaultTaxType: {
      type: String,
      enum: ["VAT_ABLE", "VAT_FREE", "VAT_ZERO", "NOT_VAT"],
      default: "VAT_ABLE"
    },
    billIdSuffix: { type: String, default: "01" },
    fallbackClassificationCode: { type: String, default: "0000000" },
    defaultMeasureUnit: { type: String, default: "ширхэг" },
    barCodeType: {
      type: String,
      enum: ["GS1", "UNDEFINED"],
      default: "UNDEFINED"
    },

    autoSendDataAfterIssue: { type: Boolean, default: false },
    strictMode: { type: Boolean, default: false },
    timeoutMs: { type: Number, default: 10000 },
    retryCount: { type: Number, default: 1 },
    storeSensitiveFields: { type: Boolean, default: true },

    xApiKey: { type: String, default: "" },

    merchantName: { type: String, default: "" },
    branchName: { type: String, default: "" },
    branchAddress: { type: String, default: "" },
    branchPhone: { type: String, default: "" },
    logoUrl: { type: String, default: "" },

    createdById: { type: String },
    updatedById: { type: String }
  },
  {
    timestamps: true,
    collection: "ebarimt_configs"
  }
);

ebarimtConfigSchema.index({ tenantId: 1, branchId: 1 }, { unique: true });

export const EbarimtConfigModel =
  mongoose.models.EbarimtConfig || model("EbarimtConfig", ebarimtConfigSchema);
