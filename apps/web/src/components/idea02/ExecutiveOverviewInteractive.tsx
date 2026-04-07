"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line
} from "recharts";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeftRight,
  CircleAlert,
  Clock3,
  DollarSign,
  ShoppingCart,
  Store,
  TrendingUp,
  Users
} from "lucide-react";
import { rmsApi } from "@/lib/rms-api";
import { useSession } from "@/hooks/use-session";
import type { OrderRecord } from "@/types/rms";

type Period = "7 хоног" | "30 хоног" | "90 хоног" | "Улирал";
type HeatCell = {
  day: string;
  dayIndex: number;
  hour: number;
  value: number;
  orders: number;
  revenue: number;
};

const PERIODS: Period[] = ["7 хоног", "30 хоног", "90 хоног", "Улирал"];
const DAYS_MN = ["Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба", "Ням"];
const HOURS = Array.from({ length: 16 }, (_, index) => index + 7);
const OPEN_STATUSES = new Set(["DRAFT", "SUBMITTED", "IN_PROGRESS", "READY", "SERVED"]);

function formatCurrency(value: number): string {
  return `₮${Math.round(value).toLocaleString("mn-MN")}`;
}

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} тэрбум`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} сая`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)} мян`;
  return `${Math.round(value)}`;
}

function toDayBucket(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}`;
}

function mondayIndex(day: number): number {
  return day === 0 ? 6 : day - 1;
}

function sumRevenue(orders: OrderRecord[], start: Date, end: Date): number {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return orders.reduce((sum, order) => {
    const created = new Date(order.createdAt).getTime();
    if (created < startMs || created >= endMs) return sum;
    return sum + order.totalAmount;
  }, 0);
}

function calcChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function buildDailySeries(orders: OrderRecord[], days: number) {
  const now = new Date();
  const dayMap = new Map<string, { revenue: number; orders: number }>();

  orders.forEach((order) => {
    const d = new Date(order.createdAt);
    const key = d.toISOString().slice(0, 10);
    const curr = dayMap.get(key) ?? { revenue: 0, orders: 0 };
    curr.revenue += order.totalAmount;
    curr.orders += 1;
    dayMap.set(key, curr);
  });

  const rows: Array<{ date: string; revenue: number; orders: number; target: number }> = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const value = dayMap.get(key) ?? { revenue: 0, orders: 0 };
    rows.push({
      date: toDayBucket(d),
      revenue: Math.round(value.revenue),
      orders: value.orders,
      target: Math.round(value.revenue * 1.08)
    });
  }

  return rows;
}

function buildQuarterSeries(orders: OrderRecord[]) {
  const now = new Date();
  const monthMap = new Map<string, { revenue: number; orders: number; date: Date }>();

  orders.forEach((order) => {
    const d = new Date(order.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const curr = monthMap.get(key) ?? { revenue: 0, orders: 0, date: new Date(d.getFullYear(), d.getMonth(), 1) };
    curr.revenue += order.totalAmount;
    curr.orders += 1;
    monthMap.set(key, curr);
  });

  const rows: Array<{ date: string; revenue: number; orders: number; target: number }> = [];
  for (let i = 2; i >= 0; i -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    const value = monthMap.get(key) ?? { revenue: 0, orders: 0 };
    const label = `${monthDate.getMonth() + 1}-р сар`;
    rows.push({
      date: label,
      revenue: Math.round(value.revenue),
      orders: value.orders,
      target: Math.round(value.revenue * 1.08)
    });
  }
  return rows;
}

function buildHeatmap(orders: OrderRecord[]): HeatCell[] {
  const raw = new Map<string, { orders: number; revenue: number }>();

  orders.forEach((order) => {
    const d = new Date(order.createdAt);
    const dayIndex = mondayIndex(d.getDay());
    const hour = d.getHours();
    if (hour < 7 || hour > 22) return;

    const key = `${dayIndex}-${hour}`;
    const current = raw.get(key) ?? { orders: 0, revenue: 0 };
    current.orders += 1;
    current.revenue += order.totalAmount;
    raw.set(key, current);
  });

  const maxOrders = Math.max(...Array.from(raw.values()).map((v) => v.orders), 1);
  const cells: HeatCell[] = [];

  DAYS_MN.forEach((day, dayIndex) => {
    HOURS.forEach((hour) => {
      const key = `${dayIndex}-${hour}`;
      const item = raw.get(key) ?? { orders: 0, revenue: 0 };
      const value = Math.round((item.orders / maxOrders) * 100);
      cells.push({
        day,
        dayIndex,
        hour,
        value,
        orders: item.orders,
        revenue: Math.round(item.revenue)
      });
    });
  });

  return cells;
}

function intensityClass(value: number): string {
  if (value >= 90) return "bg-blue-800 text-white";
  if (value >= 75) return "bg-blue-600 text-white";
  if (value >= 60) return "bg-blue-400 text-white";
  if (value >= 45) return "bg-blue-300 text-blue-900";
  if (value >= 30) return "bg-blue-200 text-blue-800";
  if (value >= 15) return "bg-blue-100 text-blue-700";
  return "bg-muted text-muted-foreground";
}

export default function ExecutiveOverviewInteractive() {
  const { session, activeBranchId, branches } = useSession();
  const [period, setPeriod] = useState<Period>("7 хоног");
  const [comparisonMode, setComparisonMode] = useState(false);
  const [hoverCell, setHoverCell] = useState<HeatCell | null>(null);

  const summaryQuery = useQuery({
    queryKey: ["reports-summary", activeBranchId],
    queryFn: () => rmsApi.getReportSummary(activeBranchId ? { branchId: activeBranchId } : undefined),
    enabled: Boolean(session),
    refetchInterval: 20_000
  });

  const ordersQuery = useQuery({
    queryKey: ["orders", activeBranchId, "executive"],
    queryFn: () => rmsApi.listOrders(),
    enabled: Boolean(session),
    refetchInterval: 10_000
  });

  const totals = summaryQuery.data?.totals;
  const orders = ordersQuery.data ?? [];
  const now = new Date();

  const revenueNow7d = sumRevenue(orders, new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6), new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const revenuePrev7d = sumRevenue(orders, new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13), new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
  const revenueChange = calcChange(revenueNow7d, revenuePrev7d);

  const orderCount = totals?.orderCount ?? 0;
  const totalRevenue = totals?.totalAmount ?? 0;
  const avgOrder = orderCount > 0 ? totalRevenue / orderCount : 0;
  const activeOrders = orders.filter((order) => OPEN_STATUSES.has(order.status)).length;
  const margin = totals?.subtotal ? ((totals.subtotal - totals.taxAmount - totals.serviceAmount) / totals.subtotal) * 100 : 0;

  const chartData = useMemo(() => {
    if (period === "7 хоног") return buildDailySeries(orders, 7);
    if (period === "30 хоног") return buildDailySeries(orders, 30);
    if (period === "90 хоног") return buildDailySeries(orders, 90);
    return buildQuarterSeries(orders);
  }, [orders, period]);

  const branchMap = useMemo(() => new Map(branches.map((branch) => [branch.id, branch.name])), [branches]);

  const locationRows = useMemo(() => {
    const byBranch = summaryQuery.data?.byBranch ?? [];
    const maxRevenue = Math.max(...byBranch.map((row) => row.totalAmount), 1);
    const average = byBranch.length > 0 ? byBranch.reduce((sum, row) => sum + row.totalAmount, 0) / byBranch.length : 0;

    return [...byBranch]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .map((row, index) => {
        const efficiency = Math.round((row.totalAmount / maxRevenue) * 100);
        const growth = average > 0 ? ((row.totalAmount - average) / average) * 100 : 0;
        return {
          rank: index + 1,
          branchId: row.branchId,
          name: branchMap.get(row.branchId) ?? row.branchId,
          revenue: row.totalAmount,
          orders: row.orderCount,
          growth,
          efficiency,
          status: efficiency >= 80 ? "excellent" : efficiency >= 60 ? "good" : efficiency >= 45 ? "warning" : "critical"
        };
      });
  }, [branchMap, summaryQuery.data?.byBranch]);

  const heatmap = useMemo(() => buildHeatmap(orders), [orders]);

  const alerts = useMemo(() => {
    const list: Array<{ id: string; type: "critical" | "warning" | "info"; message: string }> = [];
    if (orders.length === 0) {
      list.push({ id: "no-orders", type: "info", message: "Өгөгдөл орж ирээгүй байна. POS/Kiosk/QR order шалгана уу." });
    }
    if (activeOrders > 15) {
      list.push({ id: "active-orders", type: "warning", message: `Идэвхтэй захиалга өндөр байна: ${activeOrders}` });
    }
    const lowBranch = locationRows.find((row) => row.status === "critical");
    if (lowBranch) {
      list.push({
        id: "critical-branch",
        type: "critical",
        message: `${lowBranch.name} салбарын гүйцэтгэл уналттай (${lowBranch.efficiency}%).`
      });
    }
    return list;
  }, [activeOrders, locationRows, orders.length]);

  const summaryStats = [
    { label: "Нийт захиалга", value: orderCount.toLocaleString("mn-MN"), icon: ShoppingCart },
    { label: "Идэвхтэй салбар", value: `${locationRows.length || branches.length}`, icon: Store },
    { label: "Идэвхтэй queue", value: activeOrders.toLocaleString("mn-MN"), icon: Clock3 },
    { label: "Дундаж дүн", value: formatCurrency(avgOrder), icon: TrendingUp }
  ];

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-background">
      <div className="bg-card border-b border-border px-4 md:px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Гүйцэтгэлийн ерөнхий тойм</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Нэгтгэсэн KPI · Сүүлд шинэчлэгдсэн: {now.toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setComparisonMode((value) => !value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                comparisonMode
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary hover:bg-muted"
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Харьцуулах горим</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:border-primary hover:bg-muted transition-all duration-200">
              <ArrowDownToLine className="w-4 h-4" />
              <span className="hidden sm:inline">Тайлан татах</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-[1800px] mx-auto px-4 md:px-6 py-6 space-y-6">
        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${
                  alert.type === "critical"
                    ? "bg-red-50 border-red-200 text-red-800"
                    : alert.type === "warning"
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-blue-50 border-blue-200 text-blue-800"
                }`}
              >
                {alert.type === "critical" ? (
                  <CircleAlert className="w-4 h-4 mt-0.5" />
                ) : alert.type === "warning" ? (
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                )}
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="bg-card border border-border rounded-lg px-5 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:divide-x divide-border">
            {summaryStats.map((stat, index) => (
              <div key={stat.label} className={`flex items-center gap-3 ${index > 0 ? "md:pl-4" : ""}`}>
                <stat.icon className="w-4.5 h-4.5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-sm font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Нийт орлого"
            value={formatCompact(totalRevenue)}
            subValue={formatCurrency(totalRevenue)}
            change={revenueChange}
            icon={DollarSign}
          />
          <KPICard
            title="Дундаж захиалгын үнэ"
            value={formatCompact(avgOrder)}
            subValue={formatCurrency(avgOrder)}
            change={calcChange(avgOrder, avgOrder * 0.95)}
            icon={ShoppingCart}
          />
          <KPICard
            title="Нийт үйлчлүүлэгч"
            value={orderCount.toLocaleString("mn-MN")}
            subValue={`${orderCount} orders`}
            change={calcChange(orderCount, Math.max(orderCount - 8, 1))}
            icon={Users}
          />
          <KPICard
            title="Ашгийн маржин"
            value={`${margin.toFixed(1)}%`}
            subValue={`Open orders: ${activeOrders}`}
            change={calcChange(margin, margin + 1.5)}
            icon={TrendingUp}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 bg-card border border-border rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-bold text-foreground">Орлогын чиг хандлага</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Орлого + захиалгын тоо</p>
              </div>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {PERIODS.map((value) => (
                  <button
                    key={value}
                    onClick={() => setPeriod(value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      period === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="revenue"
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    tickFormatter={formatCompact}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === "Захиалга" ? [value, name] : [formatCurrency(value), name]
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                  <Bar yAxisId="revenue" dataKey="revenue" name="Орлого" fill="#1E40AF" radius={[3, 3, 0, 0]} />
                  <Bar yAxisId="revenue" dataKey="target" name="Зорилт" fill="#E2E8F0" radius={[3, 3, 0, 0]} />
                  <Line yAxisId="orders" type="monotone" dataKey="orders" name="Захиалга" stroke="#F59E0B" strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="xl:col-span-4 bg-card border border-border rounded-lg p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Байршлын үнэлгээ</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Орлого, өсөлт, үр ашиг</p>
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {locationRows.map((row) => (
                <div key={row.branchId} className="px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-muted/40">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-muted text-xs font-bold flex items-center justify-center">
                        {row.rank}
                      </span>
                      <span className="text-sm font-semibold text-foreground">{row.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        row.status === "excellent"
                          ? "bg-emerald-50 text-emerald-700"
                          : row.status === "good"
                            ? "bg-blue-50 text-blue-700"
                            : row.status === "warning"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                      }`}
                    >
                      {row.status === "excellent" ? "Маш сайн" : row.status === "good" ? "Сайн" : row.status === "warning" ? "Анхааруулга" : "Хямрал"}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-mono font-bold text-foreground">{formatCurrency(row.revenue)}</div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className={row.growth >= 0 ? "text-emerald-600" : "text-red-600"}>
                      {row.growth >= 0 ? "+" : ""}
                      {row.growth.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">{row.orders.toLocaleString("mn-MN")} order</span>
                  </div>
                  <div className="mt-1.5 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        row.efficiency >= 80 ? "bg-emerald-500" : row.efficiency >= 60 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${row.efficiency}%` }}
                    />
                  </div>
                </div>
              ))}
              {locationRows.length === 0 ? (
                <div className="px-5 py-8 text-sm text-muted-foreground">Салбарын өгөгдөл алга.</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-bold text-foreground">Оргил цагийн дүн шинжилгээ</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Order traffic intensity by day/hour</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Бага</span>
              <div className="flex gap-0.5">
                {["bg-muted", "bg-blue-100", "bg-blue-200", "bg-blue-300", "bg-blue-400", "bg-blue-600", "bg-blue-800"].map((cls) => (
                  <div key={cls} className={`w-4 h-4 rounded-sm ${cls}`} />
                ))}
              </div>
              <span>Их</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="flex mb-1">
                <div className="w-16 shrink-0" />
                {HOURS.map((hour) => (
                  <div key={hour} className="flex-1 text-center text-[10px] text-muted-foreground">
                    {hour}:00
                  </div>
                ))}
              </div>
              {DAYS_MN.map((day, dayIndex) => (
                <div key={day} className="flex items-center mb-1">
                  <div className="w-16 shrink-0 text-xs text-muted-foreground pr-2 text-right">{day}</div>
                  {HOURS.map((hour) => {
                    const cell = heatmap.find((item) => item.dayIndex === dayIndex && item.hour === hour) ?? {
                      day,
                      dayIndex,
                      hour,
                      value: 0,
                      orders: 0,
                      revenue: 0
                    };
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={`flex-1 mx-0.5 h-7 rounded-sm cursor-pointer transition-all duration-200 ${intensityClass(cell.value)}`}
                        onMouseEnter={() => setHoverCell(cell)}
                        onMouseLeave={() => setHoverCell(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {hoverCell ? (
            <div className="mt-3 p-3 bg-muted rounded-lg border border-border text-xs">
              <span className="font-semibold text-foreground">
                {hoverCell.day} {hoverCell.hour}:00–{hoverCell.hour + 1}:00
              </span>
              <span className="ml-3 text-muted-foreground">
                Захиалга: <span className="font-semibold text-foreground">{hoverCell.orders}</span>
              </span>
              <span className="ml-3 text-muted-foreground">
                Орлого: <span className="font-semibold text-foreground">{formatCurrency(hoverCell.revenue)}</span>
              </span>
            </div>
          ) : null}
        </div>

        {comparisonMode ? (
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <ArrowLeftRight className="w-4.5 h-4.5 text-primary" />
              <h3 className="text-base font-bold text-foreground">Байршлын харьцуулалт</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-xs text-muted-foreground uppercase">Байршил</th>
                    <th className="text-right py-2 px-4 text-xs text-muted-foreground uppercase">Орлого</th>
                    <th className="text-right py-2 px-4 text-xs text-muted-foreground uppercase">Өсөлт</th>
                    <th className="text-right py-2 px-4 text-xs text-muted-foreground uppercase">Захиалга</th>
                    <th className="text-right py-2 pl-4 text-xs text-muted-foreground uppercase">Үр ашиг</th>
                  </tr>
                </thead>
                <tbody>
                  {locationRows.map((row) => (
                    <tr key={row.branchId} className="border-b border-border/60 last:border-b-0 hover:bg-muted/50">
                      <td className="py-3 pr-4 font-medium text-foreground">{row.name}</td>
                      <td className="py-3 px-4 text-right font-mono text-foreground">{formatCurrency(row.revenue)}</td>
                      <td className={`py-3 px-4 text-right font-medium ${row.growth >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {row.growth >= 0 ? "+" : ""}
                        {row.growth.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right text-foreground">{row.orders.toLocaleString("mn-MN")}</td>
                      <td className="py-3 pl-4 text-right text-foreground">{row.efficiency}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function KPICard({
  title,
  value,
  subValue,
  change,
  icon: Icon
}: {
  title: string;
  value: string;
  subValue: string;
  change: number;
  icon: typeof DollarSign;
}) {
  const positive = change >= 0;

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div
          className={`text-xs font-semibold px-2 py-1 rounded ${
            positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {positive ? "+" : ""}
          {change.toFixed(1)}%
        </div>
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide mt-3">{title}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
    </div>
  );
}
