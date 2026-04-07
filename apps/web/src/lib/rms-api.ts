import { apiClient } from "@/lib/api";
import type {
  EbarimtConfigRecord,
  EbarimtReceiptRecord,
  InventoryItemRecord,
  KdsTicketRecord,
  MenuIngredientRecord,
  MenuItemRecord,
  MenuServiceWindowRecord,
  NumericLike,
  OrderRecord,
  ReportsSummary
} from "@/types/rms";

const toNumber = (value: NumericLike): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
};

const toId = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && "toString" in value) {
    return String(value);
  }
  return "";
};

const mapMenuItem = (item: Record<string, unknown>): MenuItemRecord => ({
  id: toId(item._id ?? item.id),
  category: String(item.category ?? ""),
  sku: String(item.sku ?? ""),
  name: String(item.name ?? ""),
  description: item.description ? String(item.description) : undefined,
  price: toNumber(item.price as NumericLike),
  available: Boolean(item.available),
  prepStation: item.prepStation ? String(item.prepStation) : undefined,
  tags: Array.isArray(item.tags) ? item.tags.map((tag) => String(tag)) : [],
  isSeasonal: item.isSeasonal !== undefined ? Boolean(item.isSeasonal) : undefined,
  seasonStartDate: item.seasonStartDate ? String(item.seasonStartDate) : undefined,
  seasonEndDate: item.seasonEndDate ? String(item.seasonEndDate) : undefined,
  serviceWindows: Array.isArray(item.serviceWindows)
    ? (item.serviceWindows as Array<Record<string, unknown>>).map((window): MenuServiceWindowRecord => ({
        label: window.label ? String(window.label) : undefined,
        daysOfWeek: Array.isArray(window.daysOfWeek)
          ? window.daysOfWeek.map((day) => Number(day)).filter((day) => Number.isFinite(day))
          : [],
        startTime: String(window.startTime ?? ""),
        endTime: String(window.endTime ?? ""),
        enabled: window.enabled !== undefined ? Boolean(window.enabled) : undefined
      }))
    : [],
  ingredients: Array.isArray(item.ingredients)
    ? (item.ingredients as Array<Record<string, unknown>>).map((ingredient): MenuIngredientRecord => ({
        inventoryItemId: toId(ingredient.inventoryItemId),
        inventoryItemName: String(ingredient.inventoryItemName ?? ""),
        quantity: toNumber(ingredient.quantity as NumericLike),
        unit: String(ingredient.unit ?? ""),
        wastePercent: ingredient.wastePercent !== undefined ? toNumber(ingredient.wastePercent as NumericLike) : undefined
      }))
    : []
});

const mapOrderItem = (item: Record<string, unknown>) => ({
  id: toId(item.id),
  menuItemId: String(item.menuItemId ?? ""),
  sku: item.sku ? String(item.sku) : undefined,
  itemName: String(item.itemName ?? ""),
  quantity: toNumber(item.quantity as NumericLike),
  unitPrice: toNumber(item.unitPrice as NumericLike),
  discount: toNumber(item.discount as NumericLike),
  lineTotal: toNumber(item.lineTotal as NumericLike),
  note: item.note ? String(item.note) : undefined
});

const mapEbarimtReceipt = (item: Record<string, unknown>): EbarimtReceiptRecord => ({
  billId: String(item.billId ?? ""),
  receiptNo: String(item.receiptNo ?? ""),
  serialNo: String(item.serialNo ?? ""),
  lotteryCode: String(item.lotteryCode ?? ""),
  qrText: String(item.qrText ?? ""),
  createdAt: String(item.createdAt ?? new Date().toISOString()),
  method: String(item.method ?? "CASH") as EbarimtReceiptRecord["method"],
  customerType: String(item.customerType ?? "PERSONAL") as EbarimtReceiptRecord["customerType"],
  customerName: item.customerName ? String(item.customerName) : undefined,
  customerTin: item.customerTin ? String(item.customerTin) : undefined,
  customerPhone: item.customerPhone ? String(item.customerPhone) : undefined,
  merchant: {
    name: String((item.merchant as Record<string, unknown> | undefined)?.name ?? ""),
    organizationName: String((item.merchant as Record<string, unknown> | undefined)?.organizationName ?? ""),
    branchName: String((item.merchant as Record<string, unknown> | undefined)?.branchName ?? ""),
    address: (item.merchant as Record<string, unknown> | undefined)?.address
      ? String((item.merchant as Record<string, unknown>).address)
      : undefined,
    phone: (item.merchant as Record<string, unknown> | undefined)?.phone
      ? String((item.merchant as Record<string, unknown>).phone)
      : undefined,
    logoUrl: (item.merchant as Record<string, unknown> | undefined)?.logoUrl
      ? String((item.merchant as Record<string, unknown>).logoUrl)
      : undefined
  },
  summary: {
    subtotal: toNumber((item.summary as Record<string, unknown> | undefined)?.subtotal as NumericLike),
    vatAmount: toNumber((item.summary as Record<string, unknown> | undefined)?.vatAmount as NumericLike),
    serviceAmount: toNumber((item.summary as Record<string, unknown> | undefined)?.serviceAmount as NumericLike),
    cityTaxAmount: toNumber((item.summary as Record<string, unknown> | undefined)?.cityTaxAmount as NumericLike),
    totalAmount: toNumber((item.summary as Record<string, unknown> | undefined)?.totalAmount as NumericLike),
    paidAmount: toNumber((item.summary as Record<string, unknown> | undefined)?.paidAmount as NumericLike)
  },
  order: {
    id: String((item.order as Record<string, unknown> | undefined)?.id ?? ""),
    orderNo: String((item.order as Record<string, unknown> | undefined)?.orderNo ?? "")
  },
  items: Array.isArray(item.items)
    ? (item.items as Array<Record<string, unknown>>).map((line) => ({
        itemName: String(line.itemName ?? ""),
        quantity: toNumber(line.quantity as NumericLike),
        unitPrice: toNumber(line.unitPrice as NumericLike),
        lineTotal: toNumber(line.lineTotal as NumericLike)
      }))
    : []
});

const mapEbarimtConfig = (item: Record<string, unknown>): EbarimtConfigRecord => ({
  enabled: Boolean(item.enabled),
  environment: String(item.environment ?? "staging") as EbarimtConfigRecord["environment"],
  posApiBaseUrl: String(item.posApiBaseUrl ?? "http://localhost:7080"),
  merchantTin: String(item.merchantTin ?? ""),
  branchNo: String(item.branchNo ?? "001"),
  posNo: String(item.posNo ?? "001"),
  districtCode: String(item.districtCode ?? "0101"),
  defaultBillType: String(item.defaultBillType ?? "B2C_RECEIPT") as EbarimtConfigRecord["defaultBillType"],
  defaultTaxType: String(item.defaultTaxType ?? "VAT_ABLE") as EbarimtConfigRecord["defaultTaxType"],
  billIdSuffix: String(item.billIdSuffix ?? "01"),
  fallbackClassificationCode: String(item.fallbackClassificationCode ?? "0000000"),
  defaultMeasureUnit: String(item.defaultMeasureUnit ?? "ширхэг"),
  barCodeType: String(item.barCodeType ?? "UNDEFINED") as EbarimtConfigRecord["barCodeType"],
  autoSendDataAfterIssue: Boolean(item.autoSendDataAfterIssue),
  strictMode: Boolean(item.strictMode),
  timeoutMs: toNumber(item.timeoutMs as NumericLike),
  retryCount: toNumber(item.retryCount as NumericLike),
  storeSensitiveFields: item.storeSensitiveFields !== undefined ? Boolean(item.storeSensitiveFields) : true,
  xApiKey: String(item.xApiKey ?? ""),
  merchantName: String(item.merchantName ?? ""),
  branchName: String(item.branchName ?? ""),
  branchAddress: String(item.branchAddress ?? ""),
  branchPhone: String(item.branchPhone ?? ""),
  logoUrl: String(item.logoUrl ?? "")
});

const mapOrder = (item: Record<string, unknown>): OrderRecord => {
  const tableRecord = item.table as Record<string, unknown> | null | undefined;
  const paymentRecords = Array.isArray(item.payments)
    ? (item.payments as Array<Record<string, unknown>>)
    : [];

  return {
    id: toId(item.id),
    orderNo: String(item.orderNo ?? ""),
    status: String(item.status ?? "DRAFT") as OrderRecord["status"],
    paymentStatus: String(item.paymentStatus ?? "UNPAID") as OrderRecord["paymentStatus"],
    tableCode: tableRecord?.code ? String(tableRecord.code) : null,
    guestName: item.guestName ? String(item.guestName) : undefined,
    note: item.note ? String(item.note) : undefined,
    subtotal: toNumber(item.subtotal as NumericLike),
    taxAmount: toNumber(item.taxAmount as NumericLike),
    serviceAmount: toNumber(item.serviceAmount as NumericLike),
    discountAmount: toNumber(item.discountAmount as NumericLike),
    totalAmount: toNumber(item.totalAmount as NumericLike),
    createdAt: String(item.createdAt ?? new Date().toISOString()),
    items: Array.isArray(item.items)
      ? (item.items as Array<Record<string, unknown>>).map(mapOrderItem)
      : [],
    payments: paymentRecords.map((payment) => {
      const payload = payment.payload as Record<string, unknown> | undefined;
      const ebarimtRaw = payload?.ebarimt as Record<string, unknown> | undefined;

      return {
        id: toId(payment.id),
        method: String(payment.method ?? "CASH") as
          | "CASH"
          | "CARD"
          | "SOCIALPAY"
          | "QPAY"
          | "POCKET"
          | "BANK_TRANSFER",
        amount: toNumber(payment.amount as NumericLike),
        status: String(payment.status ?? "PAID"),
        createdAt: payment.createdAt ? String(payment.createdAt) : undefined,
        ebarimt: ebarimtRaw ? mapEbarimtReceipt(ebarimtRaw) : undefined
      };
    })
  };
};

const mapInventoryItem = (item: Record<string, unknown>): InventoryItemRecord => ({
  id: toId(item.id),
  sku: String(item.sku ?? ""),
  name: String(item.name ?? ""),
  unit: String(item.unit ?? ""),
  onHand: toNumber(item.onHand as NumericLike),
  reorderLevel: toNumber(item.reorderLevel as NumericLike),
  averageCost: toNumber(item.averageCost as NumericLike),
  createdAt: item.createdAt ? String(item.createdAt) : undefined,
  updatedAt: item.updatedAt ? String(item.updatedAt) : undefined
});

const mapKdsTicket = (item: Record<string, unknown>): KdsTicketRecord => ({
  id: toId(item._id ?? item.id),
  orderId: String(item.orderId ?? ""),
  orderNo: String(item.orderNo ?? ""),
  status: String(item.status ?? "SUBMITTED") as KdsTicketRecord["status"],
  station: String(item.station ?? "main"),
  createdAt: String(item.createdAt ?? new Date().toISOString()),
  items: Array.isArray(item.items)
    ? (item.items as Array<Record<string, unknown>>).map((ticketItem) => ({
        menuItemId: ticketItem.menuItemId ? String(ticketItem.menuItemId) : undefined,
        itemName: String(ticketItem.itemName ?? ""),
        quantity: toNumber(ticketItem.quantity as NumericLike),
        note: ticketItem.note ? String(ticketItem.note) : undefined
      }))
    : []
});

export const rmsApi = {
  async listMenu(): Promise<MenuItemRecord[]> {
    const data = await apiClient.request<Array<Record<string, unknown>>>("/menu");
    return data.map(mapMenuItem);
  },

  async createMenu(input: {
    category: string;
    sku: string;
    name: string;
    description?: string;
    price: number;
    available?: boolean;
    prepStation?: string;
    tags?: string[];
    isSeasonal?: boolean;
    seasonStartDate?: string;
    seasonEndDate?: string;
    serviceWindows?: Array<{
      label?: string;
      daysOfWeek: number[];
      startTime: string;
      endTime: string;
      enabled?: boolean;
    }>;
    ingredients?: Array<{
      inventoryItemId: string;
      inventoryItemName: string;
      quantity: number;
      unit: string;
      wastePercent?: number;
    }>;
  }): Promise<MenuItemRecord> {
    const data = await apiClient.request<Record<string, unknown>>("/menu", {
      method: "POST",
      body: JSON.stringify(input)
    });
    return mapMenuItem(data);
  },

  async updateMenu(input: {
    id: string;
    category?: string;
    sku?: string;
    name?: string;
    description?: string;
    price?: number;
    available?: boolean;
    prepStation?: string;
    tags?: string[];
    isSeasonal?: boolean;
    seasonStartDate?: string;
    seasonEndDate?: string;
    serviceWindows?: Array<{
      label?: string;
      daysOfWeek: number[];
      startTime: string;
      endTime: string;
      enabled?: boolean;
    }>;
    ingredients?: Array<{
      inventoryItemId: string;
      inventoryItemName: string;
      quantity: number;
      unit: string;
      wastePercent?: number;
    }>;
  }): Promise<MenuItemRecord> {
    const data = await apiClient.request<Record<string, unknown>>(`/menu/${input.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        category: input.category,
        sku: input.sku,
        name: input.name,
        description: input.description,
        price: input.price,
        available: input.available,
        prepStation: input.prepStation,
        tags: input.tags,
        isSeasonal: input.isSeasonal,
        seasonStartDate: input.seasonStartDate,
        seasonEndDate: input.seasonEndDate,
        serviceWindows: input.serviceWindows,
        ingredients: input.ingredients
      })
    });
    return mapMenuItem(data);
  },

  async updateMenuAvailability(input: { id: string; available: boolean }): Promise<MenuItemRecord> {
    const data = await apiClient.request<Record<string, unknown>>(`/menu/${input.id}/availability`, {
      method: "PATCH",
      body: JSON.stringify({ available: input.available })
    });
    return mapMenuItem(data);
  },

  async listOrders(): Promise<OrderRecord[]> {
    const data = await apiClient.request<Array<Record<string, unknown>>>("/orders");
    return data.map(mapOrder);
  },

  async createOrder(input: {
    tableId?: string | null;
    guestName?: string;
    note?: string;
    sendToKitchen: boolean;
    items: Array<{
      menuItemId: string;
      sku?: string;
      itemName: string;
      quantity: number;
      unitPrice: number;
      discount?: number;
      note?: string;
    }>;
  }): Promise<OrderRecord> {
    const data = await apiClient.request<Record<string, unknown>>("/orders", {
      method: "POST",
      body: JSON.stringify(input)
    });
    return mapOrder(data);
  },

  async payOrder(input: {
    orderId: string;
    amount: number;
    method: "CASH" | "CARD" | "SOCIALPAY" | "QPAY" | "POCKET" | "BANK_TRANSFER";
    ebarimt?: {
      customerType: "PERSONAL" | "ORGANIZATION";
      customerName?: string;
      customerTin?: string;
      customerPhone?: string;
    };
  }): Promise<OrderRecord> {
    const data = await apiClient.request<Record<string, unknown>>("/payments", {
      method: "POST",
      body: JSON.stringify({
        orderId: input.orderId,
        amount: input.amount,
        method: input.method,
        ebarimt: input.ebarimt
      })
    });
    return mapOrder(data);
  },

  async getEbarimtConfig(): Promise<EbarimtConfigRecord> {
    const data = await apiClient.request<Record<string, unknown>>("/ebarimt/config");
    return mapEbarimtConfig(data);
  },

  async updateEbarimtConfig(input: Partial<EbarimtConfigRecord>): Promise<EbarimtConfigRecord> {
    const data = await apiClient.request<Record<string, unknown>>("/ebarimt/config", {
      method: "PUT",
      body: JSON.stringify(input)
    });
    return mapEbarimtConfig(data);
  },

  async getEbarimtPosInfo(): Promise<Record<string, unknown>> {
    return apiClient.request<Record<string, unknown>>("/ebarimt/pos/info");
  },

  async ebarimtSendData(): Promise<Record<string, unknown>> {
    return apiClient.request<Record<string, unknown>>("/ebarimt/pos/send-data", {
      method: "POST"
    });
  },

  async getEbarimtBankAccounts(tin: string): Promise<Array<Record<string, unknown>>> {
    const query = new URLSearchParams({ tin }).toString();
    return apiClient.request<Array<Record<string, unknown>>>(`/ebarimt/pos/bank-accounts?${query}`);
  },

  async getEbarimtDistrictCodes(): Promise<Record<string, unknown>> {
    return apiClient.request<Record<string, unknown>>("/ebarimt/refs/district-codes");
  },

  async listKds(): Promise<KdsTicketRecord[]> {
    const data = await apiClient.request<Array<Record<string, unknown>>>("/kds");
    return data.map(mapKdsTicket);
  },

  async updateKdsStatus(input: { id: string; status: "IN_PROGRESS" | "READY" | "SERVED" }): Promise<KdsTicketRecord> {
    const data = await apiClient.request<Record<string, unknown>>(`/kds/${input.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: input.status })
    });
    return mapKdsTicket(data);
  },

  async listInventory(): Promise<InventoryItemRecord[]> {
    const data = await apiClient.request<Array<Record<string, unknown>>>("/inventory");
    return data.map(mapInventoryItem);
  },

  async createInventory(input: {
    sku: string;
    name: string;
    unit: string;
    onHand: number;
    reorderLevel: number;
    averageCost: number;
  }): Promise<InventoryItemRecord> {
    const data = await apiClient.request<Record<string, unknown>>("/inventory", {
      method: "POST",
      body: JSON.stringify(input)
    });
    return mapInventoryItem(data);
  },

  async adjustInventory(input: {
    id: string;
    quantity: number;
    movementType: "IN" | "OUT" | "ADJUSTMENT";
    unitCost?: number;
    note?: string;
  }): Promise<InventoryItemRecord> {
    const data = await apiClient.request<Record<string, unknown>>(`/inventory/${input.id}/adjust`, {
      method: "POST",
      body: JSON.stringify({
        quantity: input.quantity,
        movementType: input.movementType,
        unitCost: input.unitCost,
        note: input.note
      })
    });
    return mapInventoryItem(data);
  },

  async getReportSummary(params?: {
    branchId?: string;
    start?: string;
    end?: string;
  }): Promise<ReportsSummary> {
    const search = new URLSearchParams();

    if (params?.branchId) search.set("branchId", params.branchId);
    if (params?.start) search.set("start", params.start);
    if (params?.end) search.set("end", params.end);

    const query = search.toString();
    const path = query.length > 0 ? `/reports/summary?${query}` : "/reports/summary";

    return apiClient.request<ReportsSummary>(path);
  }
};
