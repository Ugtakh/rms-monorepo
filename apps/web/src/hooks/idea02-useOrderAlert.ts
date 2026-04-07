"use client";

import { useEffect, useRef, useCallback, useState } from "react";

function playReadyChime(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    const notes = [523.25, 659.25, 783.99];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.45, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.55);

      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });

    window.setTimeout(() => void ctx.close().catch(() => undefined), 2000);
  } catch {
    // silent fail
  }
}

async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function sendBrowserNotification(orderNo: string, table: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const n = new Notification("Order Ready", {
      body: `Order ${orderNo} — ${table} is ready for pickup`,
      icon: "/favicon.ico",
      tag: `order-ready-${orderNo}`,
      requireInteraction: false
    });
    window.setTimeout(() => n.close(), 6000);
  } catch {
    // ignore
  }
}

export interface AlertedOrder {
  id: string;
  orderNo: string;
  table: string;
  alertedAt: number;
}

interface UseOrderAlertsOptions {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export function useOrderAlerts({ soundEnabled, notificationsEnabled }: UseOrderAlertsOptions) {
  const alertedIds = useRef<Set<string>>(new Set());
  const [recentAlerts, setRecentAlerts] = useState<AlertedOrder[]>([]);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      window.setTimeout(() => setNotifPermission(Notification.permission), 0);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
    return granted;
  }, []);

  const triggerAlert = useCallback(
    (orderId: string, orderNo: string, table: string) => {
      if (alertedIds.current.has(orderId)) return;
      alertedIds.current.add(orderId);

      if (soundEnabled) playReadyChime();
      if (notificationsEnabled) sendBrowserNotification(orderNo, table);

      const alert: AlertedOrder = { id: orderId, orderNo, table, alertedAt: Date.now() };
      setRecentAlerts((prev) => [alert, ...prev].slice(0, 10));
    },
    [soundEnabled, notificationsEnabled]
  );

  const clearAlert = useCallback((orderId: string) => {
    alertedIds.current.delete(orderId);
    setRecentAlerts((prev) => prev.filter((a) => a.id !== orderId));
  }, []);

  const isAlerted = useCallback((orderId: string) => alertedIds.current.has(orderId), []);

  return { triggerAlert, clearAlert, isAlerted, recentAlerts, notifPermission, requestPermission };
}
