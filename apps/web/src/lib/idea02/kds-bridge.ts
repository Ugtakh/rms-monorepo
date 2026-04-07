"use client";

import { useEffect, useRef, useState } from "react";
import { rmsApi } from "@/lib/rms-api";
import type { KdsTicketRecord, OrderRecord } from "@/types/rms";

export type OrderStatus =
  | "new"
  | "started"
  | "ready"
  | "complete"
  | "pending"
  | "preparing"
  | "delivered"
  | "cancelled";

export interface RealtimeOrderItem {
  id: string;
  order_id: string;
  name: string;
  qty: number;
  station: string;
  notes?: string;
  done: boolean;
}

export interface RealtimeOrder {
  id: string;
  order_no: string;
  table_label: string;
  order_type: string;
  channel: string;
  status: OrderStatus;
  station: string;
  server_name: string;
  covers: number;
  items: RealtimeOrderItem[];
  target_minutes: number;
  elapsed_seconds: number;
  location: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

interface OfflineAction {
  id: string;
  type: "update_status" | "toggle_item";
  payload: Record<string, unknown>;
  timestamp: number;
}

const OFFLINE_QUEUE_KEY = "idea02_kds_offline_queue";
const DONE_MAP_KEY = "idea02_kds_done_map";

function normalizeStation(station: string | undefined): string {
  if (!station) return "grill";
  if (station === "main") return "grill";
  return station;
}

function mapApiStatusToUi(status: KdsTicketRecord["status"]): OrderStatus {
  if (status === "SUBMITTED") return "new";
  if (status === "IN_PROGRESS") return "started";
  if (status === "READY") return "ready";
  return "complete";
}

function mapUiStatusToApi(status: OrderStatus): "IN_PROGRESS" | "READY" | "SERVED" | null {
  if (status === "started") return "IN_PROGRESS";
  if (status === "ready") return "READY";
  if (status === "complete") return "SERVED";
  return null;
}

function loadDoneMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(DONE_MAP_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveDoneMap(done: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DONE_MAP_KEY, JSON.stringify(done));
}

function loadOrderMap(orders: OrderRecord[]): Map<string, OrderRecord> {
  return new Map(orders.map((order) => [order.id, order]));
}

function inferOrderType(order?: OrderRecord): string {
  if (!order) return "dine-in";
  const note = (order.note ?? "").toUpperCase();
  if (note.includes("TYPE:DINE-IN")) return "dine-in";
  if (note.includes("TYPE:TAKEAWAY")) return "takeaway";
  if (note.includes("KIOSK")) return "takeaway";
  if ((order.note ?? "").startsWith("QR:")) return "dine-in";
  return order.tableCode ? "dine-in" : "takeaway";
}

function inferChannel(order?: OrderRecord): string {
  if (!order) return "POS";
  const note = (order.note ?? "").toUpperCase();
  if (note.includes("TABLET")) return "Tablet";
  if (note.includes("KIOSK")) return "Kiosk";
  if ((order.note ?? "").startsWith("QR:")) return "QR";
  return "POS";
}

function mergeTicket(ticket: KdsTicketRecord, orderMap: Map<string, OrderRecord>, doneMap: Record<string, boolean>): RealtimeOrder {
  const linkedOrder = orderMap.get(ticket.orderId);
  const created = ticket.createdAt || new Date().toISOString();

  const items: RealtimeOrderItem[] = ticket.items.map((item, index) => {
    const id = `${ticket.id}-${index}`;
    return {
      id,
      order_id: ticket.orderId,
      name: item.itemName,
      qty: item.quantity,
      station: normalizeStation(ticket.station),
      notes: item.note,
      done: doneMap[id] ?? false
    };
  });

  return {
    id: ticket.id,
    order_no: ticket.orderNo,
    table_label: linkedOrder?.tableCode ?? linkedOrder?.note ?? "Table -",
    order_type: inferOrderType(linkedOrder),
    channel: inferChannel(linkedOrder),
    status: mapApiStatusToUi(ticket.status),
    station: normalizeStation(ticket.station),
    server_name: "",
    covers: 0,
    items,
    target_minutes: 18,
    elapsed_seconds: Math.max(Math.floor((Date.now() - new Date(created).getTime()) / 1000), 0),
    location: "",
    amount: linkedOrder?.totalAmount ?? 0,
    created_at: created,
    updated_at: new Date().toISOString()
  };
}

function parseQueue(raw: string | null): OfflineAction[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as OfflineAction[];
  } catch {
    return [];
  }
}

function saveQueue(queue: OfflineAction[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

function enqueueOfflineAction(action: Omit<OfflineAction, "id" | "timestamp">) {
  if (typeof window === "undefined") return;
  const queue = parseQueue(window.localStorage.getItem(OFFLINE_QUEUE_KEY));
  queue.push({ ...action, id: `${Date.now()}-${Math.random()}`, timestamp: Date.now() });
  saveQueue(queue);
}

export function loadOfflineQueue(): OfflineAction[] {
  if (typeof window === "undefined") return [];
  return parseQueue(window.localStorage.getItem(OFFLINE_QUEUE_KEY));
}

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      setIsReconnecting(true);
      window.setTimeout(() => setIsReconnecting(false), 700);
    };
    const onOffline = () => {
      setIsOnline(false);
      setIsReconnecting(false);
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return { isOnline, isReconnecting };
}

async function flushOfflineQueue() {
  const queue = loadOfflineQueue();
  if (queue.length === 0) return;

  const failed: OfflineAction[] = [];
  for (const action of queue) {
    try {
      if (action.type === "update_status") {
        const id = String(action.payload.id ?? "");
        const status = String(action.payload.status ?? "") as OrderStatus;
        const mapped = mapUiStatusToApi(status);
        if (mapped && id) {
          await rmsApi.updateKdsStatus({ id, status: mapped });
        }
      }

      if (action.type === "toggle_item") {
        const itemId = String(action.payload.itemId ?? "");
        const done = Boolean(action.payload.done);
        if (itemId) {
          const doneMap = loadDoneMap();
          doneMap[itemId] = done;
          saveDoneMap(doneMap);
        }
      }
    } catch {
      failed.push(action);
    }
  }

  saveQueue(failed);
}

interface UseRealtimeOrdersOptions {
  channelName: string;
  filter?: string;
  onInsert?: (order: RealtimeOrder) => void;
  onUpdate?: (order: RealtimeOrder) => void;
  onDelete?: (id: string) => void;
}

function orderHash(order: RealtimeOrder): string {
  return JSON.stringify(order);
}

export function useRealtimeOrders(options: UseRealtimeOrdersOptions) {
  const { channelName, onInsert, onUpdate, onDelete } = options;
  const { isOnline } = useConnectionStatus();
  const [subscriptionStatus, setSubscriptionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const prevMapRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (isOnline) {
      void flushOfflineQueue();
    }
  }, [isOnline]);

  useEffect(() => {
    let active = true;
    let intervalId: number | undefined;

    const poll = async () => {
      try {
        const data = await fetchOrders();
        if (!active) return;

        const nextMap = new Map<string, string>();
        data.forEach((order) => {
          const hash = orderHash(order);
          nextMap.set(order.id, hash);

          const prevHash = prevMapRef.current.get(order.id);
          if (!prevHash) {
            onInsert?.(order);
          } else if (prevHash !== hash) {
            onUpdate?.(order);
          }
        });

        prevMapRef.current.forEach((_hash, id) => {
          if (!nextMap.has(id)) {
            onDelete?.(id);
          }
        });

        prevMapRef.current = nextMap;
        setSubscriptionStatus("connected");
      } catch {
        if (!active) return;
        setSubscriptionStatus("disconnected");
      }
    };

    setSubscriptionStatus("connecting");
    void poll();
    intervalId = window.setInterval(() => void poll(), 2500);

    return () => {
      active = false;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      setSubscriptionStatus("disconnected");
    };
  }, [channelName, onInsert, onUpdate, onDelete]);

  return { subscriptionStatus };
}

export async function updateOrderStatus(id: string, status: OrderStatus, isOnline: boolean): Promise<void> {
  const mapped = mapUiStatusToApi(status);
  if (!mapped) return;

  if (!isOnline) {
    enqueueOfflineAction({ type: "update_status", payload: { id, status } });
    return;
  }

  try {
    await rmsApi.updateKdsStatus({ id, status: mapped });
  } catch {
    enqueueOfflineAction({ type: "update_status", payload: { id, status } });
  }
}

export async function toggleOrderItem(itemId: string, done: boolean, isOnline: boolean): Promise<void> {
  const doneMap = loadDoneMap();
  doneMap[itemId] = done;
  saveDoneMap(doneMap);

  if (!isOnline) {
    enqueueOfflineAction({ type: "toggle_item", payload: { itemId, done } });
  }
}

export async function fetchOrders(_filter?: { status?: string; station?: string }): Promise<RealtimeOrder[]> {
  const [tickets, orders] = await Promise.all([rmsApi.listKds(), rmsApi.listOrders()]);
  const orderMap = loadOrderMap(orders);
  const doneMap = loadDoneMap();

  return tickets.map((ticket) => mergeTicket(ticket, orderMap, doneMap));
}
