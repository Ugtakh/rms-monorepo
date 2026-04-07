import { StatusCodes } from "http-status-codes";
import { AppError } from "../../../common/errors/app-error.js";
import type { EffectiveEbarimtConfig } from "./ebarimt-settings.service.js";
import { EbarimtSettingsService } from "./ebarimt-settings.service.js";
import { EbarimtPosApiClient } from "./ebarimt-posapi.client.js";
import type {
  EbarimtIssueMeta,
  PosApiReceiptRequest,
  PosApiReceiptResponse
} from "../types/posapi.types.js";

export interface OrderPaymentSnapshot {
  id: string;
  orderNo: string;
  subtotal: number;
  taxAmount: number;
  serviceAmount: number;
  totalAmount: number;
  items: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    sku?: string | null;
  }>;
  payments: Array<{
    amount: number;
    method: "CASH" | "CARD" | "SOCIALPAY" | "QPAY" | "POCKET" | "BANK_TRANSFER";
    status: string;
    payload?: unknown;
  }>;
}

export interface EbarimtCustomerInput {
  customerType: "PERSONAL" | "ORGANIZATION";
  customerName?: string;
  customerTin?: string;
  customerPhone?: string;
}

type PaymentMethod = "CASH" | "CARD" | "SOCIALPAY" | "QPAY" | "POCKET" | "BANK_TRANSFER";

interface BuiltReceiptLine {
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface EbarimtReceiptRecord {
  version: string;
  billId: string;
  receiptNo: string;
  serialNo: string;
  lotteryCode: string;
  qrText: string;
  createdAt: string;
  method: PaymentMethod;
  customerType: "PERSONAL" | "ORGANIZATION";
  customerName?: string;
  customerTin?: string;
  customerPhone?: string;
  merchant: {
    name: string;
    organizationName: string;
    branchName: string;
    address?: string;
    phone?: string;
    logoUrl?: string | null;
  };
  summary: {
    subtotal: number;
    vatAmount: number;
    serviceAmount: number;
    cityTaxAmount: number;
    totalAmount: number;
    paidAmount: number;
  };
  order: {
    id: string;
    orderNo: string;
  };
  items: BuiltReceiptLine[];
}

export interface EbarimtIssueResult {
  receipt: EbarimtReceiptRecord | null;
  persistedReceipt: EbarimtReceiptRecord | null;
  meta: EbarimtIssueMeta;
  request?: PosApiReceiptRequest;
  response?: PosApiReceiptResponse;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function allocateByWeight(total: number, weights: number[]): number[] {
  if (weights.length === 0) return [];

  const totalWeight = weights.reduce((acc, item) => acc + item, 0);

  if (totalWeight <= 0) {
    const even = round2(total / weights.length);
    const allocations = Array.from({ length: weights.length }, () => even);
    const diff = round2(total - allocations.reduce((acc, item) => acc + item, 0));
    allocations[allocations.length - 1] = round2(allocations[allocations.length - 1] + diff);
    return allocations;
  }

  const allocations: number[] = [];
  let running = 0;

  for (let idx = 0; idx < weights.length; idx += 1) {
    if (idx === weights.length - 1) {
      allocations.push(round2(total - running));
      continue;
    }

    const value = round2((total * weights[idx]) / totalWeight);
    allocations.push(value);
    running = round2(running + value);
  }

  return allocations;
}

function mapPaymentCode(method: PaymentMethod): {
  code: "CASH" | "PAYMENT_CARD" | "PAYMENT";
  exchangeCode?: string;
} {
  if (method === "CASH") {
    return { code: "CASH" };
  }

  if (method === "CARD") {
    return { code: "PAYMENT_CARD" };
  }

  return {
    code: "PAYMENT",
    exchangeCode: method
  };
}

function parseDateTime(value: string): string {
  const normalized = value.replace(" ", "T");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

function scrubSensitiveReceiptData(receipt: EbarimtReceiptRecord): EbarimtReceiptRecord {
  return {
    ...receipt,
    qrText: "",
    lotteryCode: ""
  };
}

function ensureOrgCustomer(input?: EbarimtCustomerInput): void {
  if (!input || input.customerType !== "ORGANIZATION") return;

  if (!input.customerName || input.customerName.trim().length < 2) {
    throw new AppError(
      "Organization customerName is required for B2B receipt",
      StatusCodes.BAD_REQUEST,
      "EBARIMT_ORG_NAME_REQUIRED"
    );
  }

  if (!input.customerTin || input.customerTin.trim().length < 2) {
    throw new AppError(
      "Organization customerTin is required for B2B receipt",
      StatusCodes.BAD_REQUEST,
      "EBARIMT_ORG_TIN_REQUIRED"
    );
  }
}

export class EbarimtService {
  static async getConfig(tenantId: string, branchId: string) {
    return EbarimtSettingsService.getEffectiveConfig({ tenantId, branchId });
  }

  static async updateConfig(input: {
    tenantId: string;
    branchId: string;
    updatedById: string;
    patch: Parameters<typeof EbarimtSettingsService.updateConfig>[0]["patch"];
  }) {
    return EbarimtSettingsService.updateConfig(input);
  }

  static async issueFromPayment(input: {
    tenantId: string;
    branchId: string;
    order: OrderPaymentSnapshot;
    amount: number;
    method: PaymentMethod;
    customer?: EbarimtCustomerInput;
  }): Promise<EbarimtIssueResult> {
    const config = await EbarimtSettingsService.getEffectiveConfig({
      tenantId: input.tenantId,
      branchId: input.branchId
    });

    const issuedAt = new Date().toISOString();

    if (!config.enabled) {
      return {
        receipt: null,
        persistedReceipt: null,
        meta: {
          provider: "POSAPI_3_0",
          status: "SKIPPED",
          reason: "EBARIMT_DISABLED",
          issuedAt
        }
      };
    }

    if (!config.merchantTin) {
      if (config.strictMode) {
        throw new AppError(
          "merchantTin missing in ebarimt config",
          StatusCodes.BAD_REQUEST,
          "EBARIMT_CONFIG_INVALID"
        );
      }

      return {
        receipt: null,
        persistedReceipt: null,
        meta: {
          provider: "POSAPI_3_0",
          status: "SKIPPED",
          reason: "MERCHANT_TIN_MISSING",
          issuedAt
        }
      };
    }

    ensureOrgCustomer(input.customer);

    const paidBefore = input.order.payments
      .filter((item) => item.status === "PAID")
      .reduce((acc, item) => acc + item.amount, 0);

    const paidAfter = round2(paidBefore + input.amount);
    const orderTotal = round2(input.order.totalAmount);

    if (paidAfter + 0.001 < orderTotal) {
      return {
        receipt: null,
        persistedReceipt: null,
        meta: {
          provider: "POSAPI_3_0",
          status: "SKIPPED",
          reason: "PARTIAL_PAYMENT",
          issuedAt
        }
      };
    }

    const requestPayload = this.buildReceiptRequest({
      config,
      order: input.order,
      paidAfter,
      currentMethod: input.method,
      currentAmount: input.amount,
      customer: input.customer
    });

    const client = new EbarimtPosApiClient(config.posApiBaseUrl);
    const response = await client.postReceipt(requestPayload, config.timeoutMs, config.retryCount);

    const baseMeta: EbarimtIssueMeta = {
      provider: "POSAPI_3_0",
      status: response.status === "SUCCESS" ? "ISSUED" : "ERROR",
      issuedAt,
      posStatus: response.status,
      message: response.message,
      billId: response.id,
      subReceiptId: response.receipts?.[0]?.id,
      date: response.date,
      raw: response
    };

    if (response.status !== "SUCCESS") {
      if (config.strictMode) {
        throw new AppError(
          `Ebarimt issue failed: ${response.message}`,
          StatusCodes.BAD_GATEWAY,
          "EBARIMT_ISSUE_FAILED",
          response
        );
      }

      return {
        receipt: null,
        persistedReceipt: null,
        meta: baseMeta,
        request: requestPayload,
        response
      };
    }

    const receipt = this.mapToReceiptRecord({
      config,
      order: input.order,
      response,
      customer: input.customer,
      method: input.method,
      paidAfter,
      requestPayload
    });

    if (config.autoSendDataAfterIssue) {
      try {
        await client.sendData(config.timeoutMs, config.retryCount);
      } catch {
        // Non-blocking follow-up sync
      }
    }

    return {
      receipt,
      persistedReceipt: config.storeSensitiveFields ? receipt : scrubSensitiveReceiptData(receipt),
      meta: baseMeta,
      request: requestPayload,
      response
    };
  }

  static async getPosInfo(input: { tenantId: string; branchId: string }) {
    const config = await EbarimtSettingsService.getEffectiveConfig(input);
    const client = new EbarimtPosApiClient(config.posApiBaseUrl);
    return client.getInfo(config.timeoutMs, config.retryCount);
  }

  static async sendData(input: { tenantId: string; branchId: string }) {
    const config = await EbarimtSettingsService.getEffectiveConfig(input);
    const client = new EbarimtPosApiClient(config.posApiBaseUrl);
    return client.sendData(config.timeoutMs, config.retryCount);
  }

  static async getBankAccounts(input: { tenantId: string; branchId: string; tin: string }) {
    const config = await EbarimtSettingsService.getEffectiveConfig(input);
    const client = new EbarimtPosApiClient(config.posApiBaseUrl);
    return client.getBankAccounts(input.tin, config.timeoutMs, config.retryCount);
  }

  static async voidReceipt(input: { tenantId: string; branchId: string; id: string; date: string }) {
    const config = await EbarimtSettingsService.getEffectiveConfig(input);
    const client = new EbarimtPosApiClient(config.posApiBaseUrl);
    return client.voidReceipt({ id: input.id, date: input.date }, config.timeoutMs, config.retryCount);
  }

  static async getDistrictCodes(input: { tenantId: string; branchId: string }) {
    const config = await EbarimtSettingsService.getEffectiveConfig(input);
    return EbarimtPosApiClient.requestCentral<
      Array<{ branchCode: string; branchName: string; subBranchCode: string; subBranchName: string }>
    >({
      environment: config.environment,
      path: "/api/info/check/getBranchInfo",
      method: "GET",
      timeoutMs: config.timeoutMs,
      retries: config.retryCount
    });
  }

  static async getTinByRegNo(input: { tenantId: string; branchId: string; regNo: string }) {
    const config = await EbarimtSettingsService.getEffectiveConfig(input);
    return EbarimtPosApiClient.requestCentral<string>({
      environment: config.environment,
      path: "/api/info/check/getTinInfo",
      query: {
        regNo: input.regNo
      },
      method: "GET",
      timeoutMs: config.timeoutMs,
      retries: config.retryCount
    });
  }

  static async getTaxpayerInfo(input: { tenantId: string; branchId: string; tin: string }) {
    const config = await EbarimtSettingsService.getEffectiveConfig(input);
    return EbarimtPosApiClient.requestCentral<{
      name: string;
      freeProject: boolean;
      cityPayer: boolean;
      vatPayer: boolean;
      found: boolean;
      vatpayerRegisteredDate: string;
      isGovernment: boolean;
    }>({
      environment: config.environment,
      path: "/api/info/check/getInfo",
      query: {
        tin: input.tin
      },
      method: "GET",
      timeoutMs: config.timeoutMs,
      retries: config.retryCount
    });
  }

  static async getProductTaxCodes(input: { tenantId: string; branchId: string }) {
    const config = await EbarimtSettingsService.getEffectiveConfig(input);
    return EbarimtPosApiClient.requestCentral<
      Array<{
        startDate: string;
        endDate: string;
        taxProductCode: string;
        taxProductName: string;
        taxTypeCode: number;
        taxTypeName: string;
      }>
    >({
      environment: config.environment,
      path: "/api/receipt/receipt/getProductTaxCode",
      method: "GET",
      timeoutMs: config.timeoutMs,
      retries: config.retryCount
    });
  }

  static async saveOperatorMerchants(input: {
    tenantId: string;
    branchId: string;
    posNo: string;
    merchantTins: string[];
    xApiKey?: string;
  }) {
    const config = await EbarimtSettingsService.getEffectiveConfig(input);
    const key = input.xApiKey ?? config.xApiKey;

    if (!key) {
      throw new AppError(
        "X-API-KEY is required for saveOprMerchants",
        StatusCodes.BAD_REQUEST,
        "EBARIMT_X_API_KEY_REQUIRED"
      );
    }

    return EbarimtPosApiClient.requestCentral<null>({
      environment: config.environment,
      path: "/api/tpi/receipt/saveOprMerchants",
      method: "POST",
      body: {
        posNo: input.posNo,
        merchantTins: input.merchantTins
      },
      xApiKey: key,
      timeoutMs: config.timeoutMs,
      retries: config.retryCount
    });
  }

  private static buildReceiptRequest(input: {
    config: EffectiveEbarimtConfig;
    order: OrderPaymentSnapshot;
    paidAfter: number;
    currentMethod: PaymentMethod;
    currentAmount: number;
    customer?: EbarimtCustomerInput;
  }): PosApiReceiptRequest {
    const weights = input.order.items.map((item) => item.lineTotal);
    const serviceAllocations = allocateByWeight(input.order.serviceAmount, weights);
    const vatAllocations = allocateByWeight(input.order.taxAmount, weights);
    const cityAllocations = allocateByWeight(0, weights);

    const itemPayload = input.order.items.map((item, idx) => {
      const lineService = serviceAllocations[idx] ?? 0;
      const lineVat = vatAllocations[idx] ?? 0;
      const lineCity = cityAllocations[idx] ?? 0;
      const taxableLineTotal = round2(item.lineTotal + lineService + lineVat + lineCity);
      const quantity = item.quantity <= 0 ? 1 : item.quantity;

      return {
        name: item.itemName,
        barCode: item.sku ?? null,
        barCodeType: input.config.barCodeType,
        classificationCode: input.config.fallbackClassificationCode,
        taxProductCode:
          input.config.defaultTaxType === "VAT_FREE" || input.config.defaultTaxType === "VAT_ZERO"
            ? "304"
            : null,
        measureUnit: input.config.defaultMeasureUnit,
        qty: quantity,
        unitPrice: round2(taxableLineTotal / quantity),
        totalVAT: lineVat,
        totalCityTax: lineCity,
        totalAmount: taxableLineTotal
      };
    });

    const previousPayments = input.order.payments
      .filter((item) => item.status === "PAID")
      .map((item) => ({
        ...mapPaymentCode(item.method),
        status: "PAID" as const,
        paidAmount: round2(item.amount)
      }));

    const currentPayment = {
      ...mapPaymentCode(input.currentMethod),
      status: "PAID" as const,
      paidAmount: round2(input.currentAmount)
    };

    const customerType = input.customer?.customerType ?? "PERSONAL";
    const type =
      customerType === "ORGANIZATION"
        ? (input.config.defaultBillType === "B2C_RECEIPT"
            ? "B2B_RECEIPT"
            : input.config.defaultBillType)
        : (input.config.defaultBillType === "B2B_RECEIPT"
            ? "B2C_RECEIPT"
            : input.config.defaultBillType);

    const subtotalWithService = round2(input.order.subtotal + input.order.serviceAmount);

    return {
      branchNo: input.config.branchNo,
      totalAmount: round2(input.order.totalAmount),
      totalVAT: round2(input.order.taxAmount),
      totalCityTax: 0,
      districtCode: input.config.districtCode,
      merchantTin: input.config.merchantTin,
      posNo: input.config.posNo,
      customerTin:
        customerType === "ORGANIZATION" ? (input.customer?.customerTin?.trim() ?? "") : null,
      consumerNo: input.customer?.customerPhone?.trim() || null,
      type,
      inactiveId: null,
      invoiceId: null,
      reportMonth: null,
      billIdSuffix: input.config.billIdSuffix,
      receipts: [
        {
          totalAmount: round2(subtotalWithService + input.order.taxAmount),
          taxType: input.config.defaultTaxType,
          merchantTin: input.config.merchantTin,
          customerTin:
            customerType === "ORGANIZATION" ? (input.customer?.customerTin?.trim() ?? "") : null,
          totalVAT: round2(input.order.taxAmount),
          totalCityTax: 0,
          bankAccountNo: null,
          iBan: null,
          invoiceId: null,
          items: itemPayload
        }
      ],
      payments: [...previousPayments, currentPayment],
      data: {
        orderNo: input.order.orderNo,
        paidAmount: input.paidAfter
      }
    };
  }

  private static mapToReceiptRecord(input: {
    config: EffectiveEbarimtConfig;
    order: OrderPaymentSnapshot;
    requestPayload: PosApiReceiptRequest;
    response: PosApiReceiptResponse;
    customer?: EbarimtCustomerInput;
    method: PaymentMethod;
    paidAfter: number;
  }): EbarimtReceiptRecord {
    const customerType = input.customer?.customerType ?? "PERSONAL";

    const items: BuiltReceiptLine[] = input.requestPayload.receipts[0].items.map((item) => ({
      itemName: item.name,
      quantity: item.qty,
      unitPrice: item.unitPrice,
      lineTotal: item.totalAmount
    }));

    const createdAt = input.response.date ? parseDateTime(input.response.date) : new Date().toISOString();

    return {
      version: "MN-EBARIMT-POSAPI-3.0",
      billId: input.response.id,
      receiptNo: input.response.id.slice(-3),
      serialNo: input.response.receipts?.[0]?.id ?? input.response.id,
      lotteryCode: input.response.lottery ?? "",
      qrText: input.response.qrData ?? input.response.qrDate ?? "",
      createdAt,
      method: input.method,
      customerType,
      customerName: customerType === "ORGANIZATION" ? input.customer?.customerName : undefined,
      customerTin: customerType === "ORGANIZATION" ? input.customer?.customerTin : undefined,
      customerPhone: input.customer?.customerPhone,
      merchant: {
        name: `${input.config.merchantName} · ${input.config.branchName}`,
        organizationName: input.config.merchantName,
        branchName: input.config.branchName,
        address: input.config.branchAddress,
        phone: input.config.branchPhone,
        logoUrl: input.config.logoUrl
      },
      summary: {
        subtotal: round2(input.order.subtotal + input.order.serviceAmount),
        vatAmount: round2(input.order.taxAmount),
        serviceAmount: round2(input.order.serviceAmount),
        cityTaxAmount: 0,
        totalAmount: round2(input.order.totalAmount),
        paidAmount: round2(input.paidAfter)
      },
      order: {
        id: input.order.id,
        orderNo: input.order.orderNo
      },
      items
    };
  }
}
