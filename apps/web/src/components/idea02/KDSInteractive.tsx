/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/hooks/use-session";
import Icon from "@/components/idea02/AppIcon";
import KDSConnectionStatusBanner from "@/components/idea02/KDSConnectionStatusBanner";
import { useOrderAlerts } from "@/hooks/idea02-useOrderAlert";

import {
  useRealtimeOrders,
  useConnectionStatus,
  updateOrderStatus,
  toggleOrderItem,
  fetchOrders,
  type RealtimeOrder,
  type OrderStatus,
} from "@/lib/idea02/kds-bridge";

// ── Types ──────────────────────────────────────────────────────────────────────

type KDSOrderStatus = "new" | "started" | "ready" | "complete";
type OrderType = "all" | "dine-in" | "takeaway" | "delivery";
type Station = "all" | "grill" | "cold" | "fryer" | "dessert" | "drinks";
type UrgencyLevel = "normal" | "warning" | "overdue";

interface OrderItem {
  id: string;
  name: string;
  qty: number;
  station: Exclude<Station, "all">;
  notes?: string;
  done: boolean;
}

interface KDSOrder {
  id: string;
  orderNo: string;
  table: string;
  type: Exclude<OrderType, "all">;
  items: OrderItem[];
  status: KDSOrderStatus;
  targetMinutes: number;
  elapsedSeconds: number;
  station: Exclude<Station, "all">;
  server: string;
  covers: number;
}

// ── Config ─────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  KDSOrderStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  new: {
    label: "New",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-300",
    dot: "bg-amber-500",
  },
  started: {
    label: "Started",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-300",
    dot: "bg-blue-500",
  },
  ready: {
    label: "Ready",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-400",
    dot: "bg-emerald-500",
  },
  complete: {
    label: "Complete",
    color: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

const STATION_CONFIG: Record<
  Exclude<Station, "all">,
  { label: string; color: string; bg: string; icon: string }
> = {
  grill: {
    label: "Grill",
    color: "text-orange-700",
    bg: "bg-orange-100",
    icon: "FireIcon",
  },
  cold: {
    label: "Cold",
    color: "text-cyan-700",
    bg: "bg-cyan-100",
    icon: "SnowflakeIcon",
  },
  fryer: {
    label: "Fryer",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
    icon: "BeakerIcon",
  },
  dessert: {
    label: "Dessert",
    color: "text-pink-700",
    bg: "bg-pink-100",
    icon: "CakeIcon",
  },
  drinks: {
    label: "Drinks",
    color: "text-indigo-700",
    bg: "bg-indigo-100",
    icon: "BeakerIcon",
  },
};

const TYPE_ICONS: Record<Exclude<OrderType, "all">, string> = {
  "dine-in": "UserGroupIcon",
  takeaway: "ShoppingBagIcon",
  delivery: "TruckIcon",
};

const TYPE_COLORS: Record<Exclude<OrderType, "all">, string> = {
  "dine-in": "bg-violet-100 text-violet-700",
  takeaway: "bg-teal-100 text-teal-700",
  delivery: "bg-sky-100 text-sky-700",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getUrgency(elapsed: number, target: number): UrgencyLevel {
  const ratio = elapsed / (target * 60);
  if (ratio >= 1) return "overdue";
  if (ratio >= 0.8) return "warning";
  return "normal";
}

const URGENCY_CARD: Record<UrgencyLevel, string> = {
  normal: "border-border bg-card",
  warning: "border-amber-300 bg-amber-50/30",
  overdue: "border-red-400 bg-red-50/40",
};

const URGENCY_TIMER: Record<UrgencyLevel, string> = {
  normal: "text-foreground",
  warning: "text-amber-600",
  overdue: "text-red-600 animate-pulse",
};

// ── Mapper: DB → KDSOrder ──────────────────────────────────────────────────────

function mapToKDSOrder(r: RealtimeOrder): KDSOrder {
  const validStatuses: KDSOrderStatus[] = [
    "new",
    "started",
    "ready",
    "complete",
  ];
  const status = validStatuses.includes(r.status as KDSOrderStatus)
    ? (r.status as KDSOrderStatus)
    : "new";

  const validStations: Exclude<Station, "all">[] = [
    "grill",
    "cold",
    "fryer",
    "dessert",
    "drinks",
  ];
  const station = validStations.includes(r.station as any)
    ? (r.station as Exclude<Station, "all">)
    : "grill";

  const validTypes: Exclude<OrderType, "all">[] = [
    "dine-in",
    "takeaway",
    "delivery",
  ];
  const type = validTypes.includes(r.order_type as any)
    ? (r.order_type as Exclude<OrderType, "all">)
    : "dine-in";

  return {
    id: r.id,
    orderNo: r.order_no,
    table: r.table_label,
    type,
    status,
    station,
    server: r.server_name,
    covers: r.covers,
    targetMinutes: r.target_minutes,
    elapsedSeconds: r.elapsed_seconds,
    items: (r.items || []).map((i) => ({
      id: i.id,
      name: i.name,
      qty: i.qty,
      station: validStations.includes(i.station as any)
        ? (i.station as Exclude<Station, "all">)
        : "grill",
      notes: i.notes,
      done: i.done,
    })),
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function TimerBadge({ elapsed, target }: { elapsed: number; target: number }) {
  const urgency = getUrgency(elapsed, target);
  return (
    <div
      className={`flex items-center gap-1.5 font-mono text-sm font-bold ${URGENCY_TIMER[urgency]}`}
    >
      {urgency === "overdue" && (
        <Icon name="ExclamationTriangleIcon" size={14} variant="solid" />
      )}
      {urgency === "warning" && (
        <Icon name="ClockIcon" size={14} variant="solid" />
      )}
      {urgency === "normal" && <Icon name="ClockIcon" size={14} />}
      <span>{formatTime(elapsed)}</span>
      <span className="text-muted-foreground font-normal text-xs">
        / {target}m
      </span>
    </div>
  );
}

function ProgressBar({ elapsed, target }: { elapsed: number; target: number }) {
  const pct = Math.min((elapsed / (target * 60)) * 100, 100);
  const urgency = getUrgency(elapsed, target);
  const barColor =
    urgency === "overdue"
      ? "bg-red-500"
      : urgency === "warning"
        ? "bg-amber-400"
        : "bg-blue-500";
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface OrderCardProps {
  order: KDSOrder;
  isAlerted: boolean;
  onStatusChange: (id: string, status: KDSOrderStatus) => void;
  onItemToggle: (orderId: string, itemId: string, currentDone: boolean) => void;
}

function OrderCard({
  order,
  isAlerted,
  onStatusChange,
  onItemToggle,
}: OrderCardProps) {
  const sc = STATUS_CONFIG[order.status];
  const stc = STATION_CONFIG[order.station];
  const urgency = getUrgency(order.elapsedSeconds, order.targetMinutes);
  const doneCount = order.items.filter((i) => i.done).length;
  const totalItems = order.items.length;
  const completionPct =
    totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;
  const isReady = order.status === "ready";

  const nextStatus: Record<KDSOrderStatus, KDSOrderStatus | null> = {
    new: "started",
    started: "ready",
    ready: "complete",
    complete: null,
  };
  const next = nextStatus[order.status];

  const nextLabel: Record<KDSOrderStatus, string> = {
    new: "Start",
    started: "Mark Ready",
    ready: "Complete",
    complete: "",
  };

  const nextBtnColor: Record<KDSOrderStatus, string> = {
    new: "bg-blue-600 hover:bg-blue-700 text-white",
    started: "bg-emerald-600 hover:bg-emerald-700 text-white",
    ready: "bg-slate-700 hover:bg-slate-800 text-white",
    complete: "",
  };

  // Ready card gets a special glowing border treatment
  const cardBorder = isReady
    ? "border-emerald-400 bg-emerald-50/40 shadow-emerald-200 shadow-md"
    : `${URGENCY_CARD[urgency]}`;

  return (
    <div
      className={`rounded-xl border-2 flex flex-col transition-all duration-300 relative ${cardBorder} ${order.status === "complete" ? "opacity-60" : ""}`}
    >
      {/* Ready visual badge — pulsing banner at top */}
      {isReady && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="flex items-center gap-1.5 bg-emerald-500 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-lg animate-pulse">
            <Icon name="BellIcon" size={11} variant="solid" />
            READY FOR PICKUP
          </span>
        </div>
      )}

      {/* Card Header */}
      <div
        className={`px-4 pt-4 pb-2 border-b border-border/60 ${isReady ? "pt-5" : "pt-3"}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-base text-foreground">
              {order.orderNo}
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${TYPE_COLORS[order.type]}`}
            >
              <Icon
                name={TYPE_ICONS[order.type] as any}
                size={10}
                variant="solid"
              />
              {order.type === "dine-in"
                ? "Dine-In"
                : order.type === "takeaway"
                  ? "Takeaway"
                  : "Delivery"}
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${stc.bg} ${stc.color}`}
            >
              <Icon name={stc.icon as any} size={10} variant="solid" />
              {stc.label}
            </span>
          </div>
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${sc.bg} ${sc.color} border ${sc.border} ${isReady ? "animate-pulse" : ""}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${order.status === "new" || order.status === "started" || isReady ? "animate-pulse" : ""}`}
            />
            {sc.label}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Icon name="MapPinIcon" size={11} />
              {order.table}
            </span>
            {order.covers > 0 && (
              <span className="flex items-center gap-1">
                <Icon name="UserGroupIcon" size={11} />
                {order.covers} covers
              </span>
            )}
            <span className="flex items-center gap-1">
              <Icon name="UserIcon" size={11} />
              {order.server}
            </span>
          </div>
          <TimerBadge
            elapsed={order.elapsedSeconds}
            target={order.targetMinutes}
          />
        </div>
        <ProgressBar
          elapsed={order.elapsedSeconds}
          target={order.targetMinutes}
        />
      </div>

      {/* Items */}
      <div className="px-4 py-2 flex-1 space-y-1.5">
        {order.items.map((item) => {
          const ist = STATION_CONFIG[item.station];
          return (
            <button
              key={item.id}
              onClick={() => onItemToggle(order.id, item.id, item.done)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all duration-200 group
                ${item.done ? "bg-emerald-50 opacity-70" : "bg-muted/50 hover:bg-muted"}`}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all
                ${item.done ? "bg-emerald-500 border-emerald-500" : "border-border bg-card group-hover:border-primary"}`}
              >
                {item.done && (
                  <Icon
                    name="CheckIcon"
                    size={10}
                    className="text-white"
                    variant="solid"
                  />
                )}
              </div>
              <span
                className={`text-xs font-medium flex-1 ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}
              >
                <span className="font-mono text-[11px] text-muted-foreground mr-1">
                  ×{item.qty}
                </span>
                {item.name}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ist.bg} ${ist.color}`}
              >
                {ist.label}
              </span>
            </button>
          );
        })}
        {order.items.some((i) => i.notes) && (
          <div className="flex items-start gap-1.5 px-2 py-1.5 bg-amber-50 rounded-lg border border-amber-200 mt-1">
            <Icon
              name="ChatBubbleLeftEllipsisIcon"
              size={12}
              className="text-amber-600 mt-0.5 shrink-0"
            />
            <span className="text-[11px] text-amber-700">
              {order.items
                .filter((i) => i.notes)
                .map((i) => i.notes)
                .join(" · ")}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 pt-2 border-t border-border/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {doneCount}/{totalItems}
            </span>{" "}
            items done
          </div>
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
        {next && (
          <button
            onClick={() => onStatusChange(order.id, next)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95 ${nextBtnColor[order.status]}`}
          >
            {nextLabel[order.status]}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Analytics Panel ────────────────────────────────────────────────────────────

function AnalyticsPanel({ orders }: { orders: KDSOrder[] }) {
  const active = orders.filter((o) => o.status !== "complete");
  const completed = orders.filter((o) => o.status === "complete");
  const overdue = orders.filter(
    (o) =>
      getUrgency(o.elapsedSeconds, o.targetMinutes) === "overdue" &&
      o.status !== "complete",
  );
  const warning = orders.filter(
    (o) =>
      getUrgency(o.elapsedSeconds, o.targetMinutes) === "warning" &&
      o.status !== "complete",
  );
  const readyOrders = orders.filter((o) => o.status === "ready");

  const avgElapsed =
    active.length > 0
      ? Math.round(
          active.reduce((s, o) => s + o.elapsedSeconds, 0) / active.length / 60,
        )
      : 0;

  const stationLoad = (
    ["grill", "cold", "fryer", "dessert", "drinks"] as Exclude<Station, "all">[]
  ).map((s) => ({
    station: s,
    count: active.filter((o) => o.station === s).length,
    label: STATION_CONFIG[s].label,
    color: STATION_CONFIG[s].color,
    bg: STATION_CONFIG[s].bg,
    icon: STATION_CONFIG[s].icon,
  }));

  const upcoming = orders.filter((o) => o.status === "new").slice(0, 3);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Ready Orders Alert */}
      {readyOrders.length > 0 && (
        <div className="bg-emerald-50 rounded-xl border-2 border-emerald-400 shadow-sm p-4 animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <Icon
              name="BellAlertIcon"
              size={16}
              className="text-emerald-600"
              variant="solid"
            />
            <h3 className="font-semibold text-sm text-emerald-800">
              Ready for Pickup
            </h3>
            <span className="ml-auto bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {readyOrders.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {readyOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-lg border border-emerald-200"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-mono text-xs font-bold text-emerald-800">
                  {o.orderNo}
                </span>
                <span className="text-xs text-emerald-700 flex-1">
                  {o.table}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shift Summary */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
          <Icon name="ChartBarIcon" size={14} className="text-primary" />
          Shift Summary
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Active",
              value: active.length,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Completed",
              value: completed.length,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Overdue",
              value: overdue.length,
              color: "text-red-600",
              bg: "bg-red-50",
            },
            {
              label: "Avg Time",
              value: `${avgElapsed}m`,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
          ].map((m) => (
            <div
              key={m.label}
              className={`${m.bg} rounded-lg p-2.5 text-center`}
            >
              <div className={`text-xl font-bold font-mono ${m.color}`}>
                {m.value}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {m.label}
              </div>
            </div>
          ))}
        </div>
        {(overdue.length > 0 || warning.length > 0) && (
          <div
            className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
            ${overdue.length > 0 ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}
          >
            <Icon name="ExclamationTriangleIcon" size={13} variant="solid" />
            {overdue.length > 0
              ? `${overdue.length} order${overdue.length > 1 ? "s" : ""} overdue!`
              : `${warning.length} order${warning.length > 1 ? "s" : ""} approaching limit`}
          </div>
        )}
      </div>

      {/* Station Load */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
          <Icon
            name="BuildingStorefrontIcon"
            size={14}
            className="text-primary"
          />
          Station Load
        </h3>
        <div className="space-y-2">
          {stationLoad.map((s) => (
            <div key={s.station} className="flex items-center gap-2.5">
              <div
                className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${s.bg}`}
              >
                <Icon
                  name={s.icon as any}
                  size={12}
                  className={s.color}
                  variant="solid"
                />
              </div>
              <span className="text-xs text-muted-foreground w-14 shrink-0">
                {s.label}
              </span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${s.count >= 3 ? "bg-red-500" : s.count >= 2 ? "bg-amber-400" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(s.count * 25, 100)}%` }}
                />
              </div>
              <span
                className={`text-xs font-mono font-bold w-4 text-right ${s.count >= 3 ? "text-red-600" : s.count >= 2 ? "text-amber-600" : "text-emerald-600"}`}
              >
                {s.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Orders */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex-1">
        <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
          <Icon name="QueueListIcon" size={14} className="text-primary" />
          Upcoming Queue
        </h3>
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Icon
              name="CheckCircleIcon"
              size={28}
              className="text-emerald-400 mb-2"
            />
            <span className="text-xs">Queue clear</span>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((o, idx) => {
              const stc = STATION_CONFIG[o.station];
              return (
                <div
                  key={o.id}
                  className="flex items-center gap-2.5 px-2.5 py-2 bg-muted/50 rounded-lg"
                >
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {o.orderNo}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${stc.bg} ${stc.color}`}
                      >
                        {stc.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {o.table} · {o.items.length} items
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {o.targetMinutes}m
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Alert Controls Component ───────────────────────────────────────────────────

interface AlertControlsProps {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  notifPermission: NotificationPermission;
  readyCount: number;
  onToggleSound: () => void;
  onToggleNotifications: () => void;
  onRequestPermission: () => void;
}

function AlertControls({
  soundEnabled,
  notificationsEnabled,
  notifPermission,
  readyCount,
  onToggleSound,
  onToggleNotifications,
  onRequestPermission,
}: AlertControlsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {/* Ready badge */}
      {readyCount > 0 && (
        <div className="flex items-center gap-1.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
          <Icon name="BellAlertIcon" size={12} variant="solid" />
          {readyCount} Ready
        </div>
      )}

      {/* Sound toggle */}
      <button
        onClick={onToggleSound}
        title={soundEnabled ? "Mute sound alerts" : "Enable sound alerts"}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200
          ${
            soundEnabled
              ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          }`}
      >
        <Icon
          name={soundEnabled ? "SpeakerWaveIcon" : "SpeakerXMarkIcon"}
          size={13}
          variant={soundEnabled ? "solid" : "outline"}
        />
        <span className="hidden sm:inline">
          {soundEnabled ? "Sound On" : "Sound Off"}
        </span>
      </button>

      {/* Notification toggle / permission request */}
      {notifPermission === "default" ? (
        <button
          onClick={onRequestPermission}
          title="Enable browser notifications"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all duration-200"
        >
          <Icon name="BellIcon" size={13} />
          <span className="hidden sm:inline">Allow Alerts</span>
        </button>
      ) : notifPermission === "granted" ? (
        <button
          onClick={onToggleNotifications}
          title={
            notificationsEnabled
              ? "Disable push notifications"
              : "Enable push notifications"
          }
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200
            ${
              notificationsEnabled
                ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
        >
          <Icon
            name={notificationsEnabled ? "BellAlertIcon" : "BellSlashIcon"}
            size={13}
            variant={notificationsEnabled ? "solid" : "outline"}
          />
          <span className="hidden sm:inline">
            {notificationsEnabled ? "Notifs On" : "Notifs Off"}
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground border border-border bg-card">
          <Icon name="BellSlashIcon" size={13} />
          <span className="hidden sm:inline">Blocked</span>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function KDSInteractive() {
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderType>("all");
  const [stationFilter, setStationFilter] = useState<Station>("all");
  const [showComplete, setShowComplete] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const { isOnline, isReconnecting } = useConnectionStatus();
  const { branches, activeBranchId } = useSession();
  const selectedBranch =
    branches.find((branch) => branch.id === activeBranchId) ?? null;
  const isAllBranches = !activeBranchId;

  const { triggerAlert, isAlerted, notifPermission, requestPermission } =
    useOrderAlerts({
      soundEnabled,
      notificationsEnabled,
    });

  // Track previous statuses to detect transitions to 'ready'
  const prevStatusRef = useRef<Map<string, KDSOrderStatus>>(new Map());

  // ── Initial fetch ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchOrders().then((data) => {
      const mapped = data.map(mapToKDSOrder);
      setOrders(mapped);
      // Seed previous statuses — don't alert on initial load
      mapped.forEach((o) => prevStatusRef.current.set(o.id, o.status));
      setLoading(false);
    });
  }, []);

  // ── Live timer tick every second ─────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.status === "new" || o.status === "started") {
            return { ...o, elapsedSeconds: o.elapsedSeconds + 1 };
          }
          return o;
        }),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Alert trigger: watch for status → 'ready' transitions ───────────────────
  useEffect(() => {
    orders.forEach((o) => {
      const prev = prevStatusRef.current.get(o.id);
      if (o.status === "ready" && prev !== "ready") {
        triggerAlert(o.id, o.orderNo, o.table);
      }
      prevStatusRef.current.set(o.id, o.status);
    });
  }, [orders, triggerAlert]);

  // ── Real-time subscription ───────────────────────────────────────────────────
  const { subscriptionStatus } = useRealtimeOrders({
    channelName: "kds-orders",
    onInsert: (order) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        const mapped = mapToKDSOrder(order);
        prevStatusRef.current.set(mapped.id, mapped.status);
        return [mapped, ...prev];
      });
    },
    onUpdate: (order) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? mapToKDSOrder(order) : o)),
      );
    },
    onDelete: (id) => {
      setOrders((prev) => prev.filter((o) => o.id !== id));
      prevStatusRef.current.delete(id);
    },
  });

  const handleStatusChange = useCallback(
    async (id: string, status: KDSOrderStatus) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o)),
      );
      await updateOrderStatus(id, status as OrderStatus, isOnline);
    },
    [isOnline],
  );

  const handleItemToggle = useCallback(
    async (orderId: string, itemId: string, currentDone: boolean) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          return {
            ...o,
            items: o.items.map((i) =>
              i.id === itemId ? { ...i, done: !i.done } : i,
            ),
          };
        }),
      );
      await toggleOrderItem(itemId, !currentDone, isOnline);
    },
    [isOnline],
  );

  // API layer already scopes by active tenant/branch headers.
  const branchFiltered = orders;

  const filtered = branchFiltered.filter((o) => {
    if (!showComplete && o.status === "complete") return false;
    if (orderTypeFilter !== "all" && o.type !== orderTypeFilter) return false;
    if (stationFilter !== "all" && o.station !== stationFilter) return false;
    return true;
  });

  const activeCount = branchFiltered.filter(
    (o) => o.status !== "complete",
  ).length;
  const overdueCount = branchFiltered.filter(
    (o) =>
      getUrgency(o.elapsedSeconds, o.targetMinutes) === "overdue" &&
      o.status !== "complete",
  ).length;
  const readyCount = branchFiltered.filter((o) => o.status === "ready").length;

  const sorted = [...filtered].sort((a, b) => {
    // Ready orders always first
    if (a.status === "ready" && b.status !== "ready") return -1;
    if (b.status === "ready" && a.status !== "ready") return 1;
    const ua = getUrgency(a.elapsedSeconds, a.targetMinutes);
    const ub = getUrgency(b.elapsedSeconds, b.targetMinutes);
    const urgencyOrder = { overdue: 0, warning: 1, normal: 2 };
    if (urgencyOrder[ua] !== urgencyOrder[ub])
      return urgencyOrder[ua] - urgencyOrder[ub];
    return b.elapsedSeconds - a.elapsedSeconds;
  });

  return (
    <div className="h-full min-h-0 bg-background flex flex-col">
      <div className="flex-1 flex flex-col">
        {/* KDS Top Bar */}
        <div className="bg-card border-b border-border px-6 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-2 h-2 rounded-full ${subscriptionStatus === "connected" ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`}
            />
            <h1 className="font-heading font-bold text-base text-foreground">
              Kitchen Display System
            </h1>
            {!isAllBranches && selectedBranch && (
              <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                <Icon name="MapPinIcon" size={11} />
                {selectedBranch.name}
              </span>
            )}
            <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
              {activeCount} active
            </span>
            {overdueCount > 0 && (
              <span className="text-xs font-mono bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Icon
                  name="ExclamationTriangleIcon"
                  size={11}
                  variant="solid"
                />
                {overdueCount} overdue
              </span>
            )}
          </div>

          <div className="flex-1" />

          {/* Alert Controls */}
          <AlertControls
            soundEnabled={soundEnabled}
            notificationsEnabled={notificationsEnabled}
            notifPermission={notifPermission}
            readyCount={readyCount}
            onToggleSound={() => setSoundEnabled((v) => !v)}
            onToggleNotifications={() => setNotificationsEnabled((v) => !v)}
            onRequestPermission={requestPermission}
          />

          {/* Connection status */}
          <KDSConnectionStatusBanner
            isOnline={isOnline}
            isReconnecting={isReconnecting}
            subscriptionStatus={subscriptionStatus}
          />

          {/* Order Type Filter */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {(["all", "dine-in", "takeaway", "delivery"] as OrderType[]).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setOrderTypeFilter(t)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200
                  ${orderTypeFilter === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t === "all"
                    ? "All Types"
                    : t === "dine-in"
                      ? "Dine-In"
                      : t === "takeaway"
                        ? "Takeaway"
                        : "Delivery"}
                </button>
              ),
            )}
          </div>

          {/* Station Filter */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {(
              [
                "all",
                "grill",
                "cold",
                "fryer",
                "dessert",
                "drinks",
              ] as Station[]
            ).map((s) => (
              <button
                key={s}
                onClick={() => setStationFilter(s)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200
                  ${stationFilter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {s === "all" ? "All Stations" : STATION_CONFIG[s].label}
              </button>
            ))}
          </div>

          {/* Show Complete Toggle */}
          <button
            onClick={() => setShowComplete((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200
              ${showComplete ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
          >
            <Icon
              name="CheckCircleIcon"
              size={13}
              variant={showComplete ? "solid" : "outline"}
            />
            Completed
          </button>
        </div>

        {/* Main Layout */}
        <div className="flex-1 flex gap-0 overflow-hidden">
          {/* Order Queue */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm">Loading orders…</p>
              </div>
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Icon
                  name="CheckCircleIcon"
                  size={48}
                  className="text-emerald-400 mb-3"
                />
                <p className="font-semibold text-foreground">All clear!</p>
                <p className="text-sm mt-1">
                  No orders matching current filters
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
                {sorted.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isAlerted={isAlerted(order.id)}
                    onStatusChange={handleStatusChange}
                    onItemToggle={handleItemToggle}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Analytics Panel */}
          <div className="w-72 shrink-0 border-l border-border bg-background overflow-y-auto p-4 hidden lg:block">
            <AnalyticsPanel orders={branchFiltered} />
          </div>
        </div>
      </div>
    </div>
  );
}
