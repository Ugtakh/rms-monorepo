"use client";

import { useEffect, useRef } from "react";
import type { KdsTicket } from "@/lib/pwa/types";

type WsMessage =
  | { type: "system.connected"; payload: { ok: boolean; ts: string } }
  | { type: "kds.ticket.created"; payload: KdsTicket }
  | { type: "kds.ticket.updated"; payload: KdsTicket }
  | { type: "order.created"; payload: unknown }
  | { type: "order.updated"; payload: unknown };

export function useBranchWebSocket(
  wsUrl: string,
  onMessage: (message: WsMessage) => void
) {
  const reconnectRef = useRef<number | null>(null);

  useEffect(() => {
    let socket: WebSocket | null = null;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(String(event.data)) as WsMessage;
          onMessage(parsed);
        } catch {
          // ignore bad message
        }
      };

      socket.onclose = () => {
        reconnectRef.current = window.setTimeout(connect, 3000);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      socket?.close();
      if (reconnectRef.current) {
        window.clearTimeout(reconnectRef.current);
      }
    };
  }, [wsUrl, onMessage]);
}