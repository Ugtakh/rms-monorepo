"use client";

import { useEffect, useState } from "react";

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const onOnline = () => {
      setIsReconnecting(true);
      setIsOnline(true);
      window.setTimeout(() => setIsReconnecting(false), 700);
    };

    const onOffline = () => {
      setIsReconnecting(false);
      setIsOnline(false);
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

type InsertOrderInput = {
  order_no: string;
  table_label: string;
  order_type: string;
  channel: string;
  status: string;
  station: string;
  server_name: string;
  covers: number;
  target_minutes: number;
  elapsed_seconds: number;
  location: string;
  amount: number;
  items: Array<{
    id: string;
    order_id: string;
    name: string;
    qty: number;
    station: string;
    notes?: string;
    done: boolean;
  }>;
};

export async function insertOrder(order: InsertOrderInput, _isOnline: boolean) {
  const key = "idea02_kiosk_orders";
  const current = JSON.parse(window.localStorage.getItem(key) ?? "[]") as InsertOrderInput[];
  current.unshift(order);
  window.localStorage.setItem(key, JSON.stringify(current.slice(0, 200)));
  await new Promise((resolve) => setTimeout(resolve, 420));
  return { id: order.order_no };
}
