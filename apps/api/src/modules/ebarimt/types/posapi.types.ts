export type EbarimtBillType = "B2C_RECEIPT" | "B2B_RECEIPT" | "B2C_INVOICE" | "B2B_INVOICE";

export type EbarimtTaxType = "VAT_ABLE" | "VAT_FREE" | "VAT_ZERO" | "NOT_VAT";

export type EbarimtPaymentCode = "CASH" | "PAYMENT_CARD" | "PAYMENT";

export type PosApiEnvironment = "staging" | "production";

export interface PosApiReceiptItem {
  name: string;
  barCode: string | null;
  barCodeType: "GS1" | "UNDEFINED";
  classificationCode: string;
  taxProductCode?: string | null;
  measureUnit: string;
  qty: number;
  unitPrice: number;
  totalVAT: number;
  totalCityTax: number;
  totalAmount: number;
  data?: {
    lotNo?: string;
    stockQR?: string[];
  } | null;
}

export interface PosApiSubReceipt {
  totalAmount: number;
  taxType: EbarimtTaxType;
  merchantTin: string;
  customerTin?: string | null;
  totalVAT: number;
  totalCityTax: number;
  bankAccountNo?: string | null;
  iBan?: string | null;
  invoiceId?: string | null;
  items: PosApiReceiptItem[];
}

export interface PosApiPayment {
  code: EbarimtPaymentCode;
  exchangeCode?: string;
  status: "PAID" | "PAY" | "REVERSED" | "ERROR";
  paidAmount: number;
  data?: {
    terminalID?: string;
    rrn?: string;
    maskedCardNumber?: string;
    easy?: boolean;
    bankCode?: string;
  } | null;
}

export interface PosApiReceiptRequest {
  branchNo: string;
  totalAmount: number;
  totalVAT: number;
  totalCityTax: number;
  districtCode: string;
  merchantTin: string;
  posNo: string;
  customerTin?: string | null;
  consumerNo?: string | null;
  type: EbarimtBillType;
  inactiveId?: string | null;
  invoiceId?: string | null;
  reportMonth?: string | null;
  billIdSuffix: string;
  receipts: PosApiSubReceipt[];
  payments: PosApiPayment[];
  data?: Record<string, unknown> | null;
}

export interface PosApiReceiptResponse {
  id: string;
  posId: number;
  status: "SUCCESS" | "ERROR" | "PAYMENT" | string;
  message: string;
  qrData?: string;
  qrDate?: string;
  lottery?: string;
  date: string;
  easy?: string | boolean;
  receipts?: Array<{
    id: string;
    bankAccountId?: number;
  }>;
  [key: string]: unknown;
}

export interface PosApiInfoResponse {
  operatorName: string;
  operatorTIN: string;
  posId: number;
  posNo: string;
  lastSentDate: string;
  leftLotteries: number;
  appInfo: {
    applicationDir: string;
    currentDir: string;
    database: string;
    "database-host": string;
    workDir: string;
  };
  merchants: Array<{
    name: string;
    tin: string;
    customers: Array<{
      name: string;
      tin: string;
      vatPayer: string;
    }>;
  }>;
}

export interface PosApiBankAccount {
  id: number;
  tin: string;
  bankAccountNo: string;
  bankAccountName: string;
  bankId: number;
  iBan: string;
  bankName: string;
}

export interface EbarimtCentralResponse<T> {
  status: number;
  msg: string;
  data: T;
  code?: string | null;
}

export interface EbarimtIssueMeta {
  provider: "POSAPI_3_0";
  status: "ISSUED" | "SKIPPED" | "ERROR";
  reason?: string;
  posStatus?: string;
  message?: string;
  billId?: string;
  subReceiptId?: string;
  issuedAt: string;
  date?: string;
  raw?: unknown;
}
