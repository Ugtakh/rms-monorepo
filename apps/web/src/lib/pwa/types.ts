export type BranchConfig = {
  branchApiBaseUrl: string;
  branchWsUrl: string;
  tenantId: string;
  branchId: string;
  restaurantId: string;
  station: string;
  cashierId: string;
  cashierName: string;
};

export type PendingMutationType =
  | "order.create"
  | "kds.ticket.status.update";

export type PendingMutation = {
  id: string;
  type: PendingMutationType;
  endpoint: string;
  method: "POST" | "PATCH";
  payload: unknown;
  createdAt: string;
  retryCount: number;
  syncStatus: "pending" | "failed";
  lastError?: string;
};

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  currency: string;
  isAvailable: boolean;
};

export type KdsTicket = {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  status: "queued" | "preparing" | "ready" | "served" | "cancelled";
  station: string;
  created_at: string;
  updated_at: string;
};

export type LocalOrderPayload = {
  tenantId: string;
  branchId: string;
  restaurantId: string;
  tableNo?: string;
  notes?: string;
  cashierId?: string;
  cashierName?: string;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
};