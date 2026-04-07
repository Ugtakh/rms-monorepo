export type NumericLike = number | string | null | undefined;

export interface TenantSummary {
  id: string;
  code: string;
  name: string;
}

export interface BranchSummary {
  id: string;
  code: string;
  name: string;
  tenantId?: string;
}

export interface MenuItemRecord {
  id: string;
  category: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  available: boolean;
  prepStation?: string;
  tags: string[];
  ingredients: MenuIngredientRecord[];
  isSeasonal?: boolean;
  seasonStartDate?: string;
  seasonEndDate?: string;
  serviceWindows: MenuServiceWindowRecord[];
}

export interface MenuIngredientRecord {
  inventoryItemId: string;
  inventoryItemName: string;
  quantity: number;
  unit: string;
  wastePercent?: number;
}

export interface MenuServiceWindowRecord {
  label?: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  enabled?: boolean;
}

export interface OrderItemRecord {
  id: string;
  menuItemId: string;
  sku?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  note?: string;
}

export interface PaymentRecord {
  id: string;
  method: "CASH" | "CARD" | "SOCIALPAY" | "QPAY" | "POCKET" | "BANK_TRANSFER";
  amount: number;
  status: string;
  createdAt?: string;
  ebarimt?: EbarimtReceiptRecord;
}

export interface EbarimtReceiptRecord {
  billId: string;
  receiptNo: string;
  serialNo: string;
  lotteryCode: string;
  qrText: string;
  createdAt: string;
  method: "CASH" | "CARD" | "SOCIALPAY" | "QPAY" | "POCKET" | "BANK_TRANSFER";
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
  items: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

export interface EbarimtConfigRecord {
  enabled: boolean;
  environment: "staging" | "production";
  posApiBaseUrl: string;
  merchantTin: string;
  branchNo: string;
  posNo: string;
  districtCode: string;
  defaultBillType: "B2C_RECEIPT" | "B2B_RECEIPT" | "B2C_INVOICE" | "B2B_INVOICE";
  defaultTaxType: "VAT_ABLE" | "VAT_FREE" | "VAT_ZERO" | "NOT_VAT";
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
}

export interface OrderRecord {
  id: string;
  orderNo: string;
  status: "DRAFT" | "SUBMITTED" | "IN_PROGRESS" | "READY" | "SERVED" | "CLOSED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
  tableCode: string | null;
  guestName?: string;
  note?: string;
  subtotal: number;
  taxAmount: number;
  serviceAmount: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  items: OrderItemRecord[];
  payments: PaymentRecord[];
}

export interface KdsTicketRecord {
  id: string;
  orderId: string;
  orderNo: string;
  status: "SUBMITTED" | "IN_PROGRESS" | "READY" | "SERVED";
  station: string;
  createdAt: string;
  items: Array<{
    menuItemId?: string;
    itemName: string;
    quantity: number;
    note?: string;
  }>;
}

export interface InventoryItemRecord {
  id: string;
  sku: string;
  name: string;
  unit: string;
  onHand: number;
  reorderLevel: number;
  averageCost: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReportsSummary {
  totals: {
    orderCount: number;
    subtotal: number;
    taxAmount: number;
    serviceAmount: number;
    totalAmount: number;
  };
  byBranch: Array<{
    branchId: string;
    orderCount: number;
    totalAmount: number;
  }>;
  byPaymentMethod: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
}
