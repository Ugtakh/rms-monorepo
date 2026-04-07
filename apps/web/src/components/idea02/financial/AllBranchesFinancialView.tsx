/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import Icon from "@/components/idea02/AppIcon";

interface BranchSummary {
  branchId: string;
  branchName: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  growth: number;
  orderCount: number;
  bankPos: number;
  qpay: number;
  status: "excellent" | "good" | "average" | "poor";
}

const formatMNT = (v: number) => {
  if (v >= 1_000_000_000) return `₮${(v / 1_000_000_000).toFixed(1)}Т`;
  if (v >= 1_000_000) return `₮${(v / 1_000_000).toFixed(0)}М`;
  return `₮${v.toLocaleString()}`;
};

const BRANCH_COLORS = ["#1E40AF", "#059669", "#D97706", "#7C3AED", "#DC2626"];

const statusConfig = {
  excellent: {
    label: "Маш сайн",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500"
  },
  good: {
    label: "Сайн",
    color: "text-blue-700",
    bg: "bg-blue-50",
    dot: "bg-blue-500"
  },
  average: {
    label: "Дундаж",
    color: "text-amber-700",
    bg: "bg-amber-50",
    dot: "bg-amber-500"
  },
  poor: {
    label: "Муу",
    color: "text-red-700",
    bg: "bg-red-50",
    dot: "bg-red-500"
  }
} as const;

const FALLBACK_SUMMARIES: BranchSummary[] = [
  {
    branchId: "b1",
    branchName: "Төв салбар",
    revenue: 245000000,
    costs: 118000000,
    profit: 127000000,
    margin: 51.8,
    growth: 14.2,
    orderCount: 2180,
    bankPos: 166600000,
    qpay: 78400000,
    status: "excellent"
  },
  {
    branchId: "b2",
    branchName: "Баянгол салбар",
    revenue: 187000000,
    costs: 95000000,
    profit: 92000000,
    margin: 49.2,
    growth: 11.7,
    orderCount: 1680,
    bankPos: 127160000,
    qpay: 59840000,
    status: "good"
  },
  {
    branchId: "b3",
    branchName: "Хан-Уул салбар",
    revenue: 163000000,
    costs: 84000000,
    profit: 79000000,
    margin: 48.5,
    growth: 9.3,
    orderCount: 1470,
    bankPos: 110840000,
    qpay: 52160000,
    status: "good"
  },
  {
    branchId: "b4",
    branchName: "Сүхбаатар салбар",
    revenue: 142000000,
    costs: 71000000,
    profit: 71000000,
    margin: 50.0,
    growth: 6.8,
    orderCount: 1280,
    bankPos: 96560000,
    qpay: 45440000,
    status: "average"
  },
  {
    branchId: "b5",
    branchName: "Налайх салбар",
    revenue: 110000000,
    costs: 55000000,
    profit: 55000000,
    margin: 50.0,
    growth: 4.1,
    orderCount: 990,
    bankPos: 74800000,
    qpay: 35200000,
    status: "average"
  }
];

const FALLBACK_TREND = [
  {
    name: "1-р сар",
    "Төв салбар": 205000000,
    "Баянгол салбар": 156000000,
    "Хан-Уул салбар": 142000000,
    "Сүхбаатар салбар": 121000000,
    "Налайх салбар": 93000000
  },
  {
    name: "2-р сар",
    "Төв салбар": 216000000,
    "Баянгол салбар": 165000000,
    "Хан-Уул салбар": 149000000,
    "Сүхбаатар салбар": 128000000,
    "Налайх салбар": 98000000
  },
  {
    name: "3-р сар",
    "Төв салбар": 224000000,
    "Баянгол салбар": 171000000,
    "Хан-Уул салбар": 153000000,
    "Сүхбаатар салбар": 133000000,
    "Налайх салбар": 102000000
  },
  {
    name: "4-р сар",
    "Төв салбар": 233000000,
    "Баянгол салбар": 179000000,
    "Хан-Уул салбар": 158000000,
    "Сүхбаатар салбар": 137000000,
    "Налайх салбар": 106000000
  },
  {
    name: "5-р сар",
    "Төв салбар": 245000000,
    "Баянгол салбар": 187000000,
    "Хан-Уул салбар": 163000000,
    "Сүхбаатар салбар": 142000000,
    "Налайх салбар": 110000000
  },
  {
    name: "6-р сар",
    "Төв салбар": 254000000,
    "Баянгол салбар": 194000000,
    "Хан-Уул салбар": 170000000,
    "Сүхбаатар салбар": 147000000,
    "Налайх салбар": 115000000
  }
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-elevated p-3 min-w-45">
      <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-3 text-xs mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
          </span>
          <span className="font-mono font-medium text-foreground">{formatMNT(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function AllBranchesFinancialView() {
  const [summaries] = useState<BranchSummary[]>(FALLBACK_SUMMARIES);
  const [trendData] = useState<any[]>(FALLBACK_TREND);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"comparison" | "trend" | "breakdown">("comparison");

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(id);
  }, []);

  const totalRevenue = summaries.reduce((s, b) => s + b.revenue, 0);
  const totalCosts = summaries.reduce((s, b) => s + b.costs, 0);
  const totalProfit = summaries.reduce((s, b) => s + b.profit, 0);
  const avgMargin = summaries.length > 0 ? summaries.reduce((s, b) => s + b.margin, 0) / summaries.length : 0;
  const totalOrders = summaries.reduce((s, b) => s + b.orderCount, 0);

  const comparisonData = summaries.map((b) => ({
    name: b.branchName.replace(" салбар", ""),
    Орлого: b.revenue,
    Зардал: b.costs,
    Ашиг: b.profit
  }));

  const breakdownData = summaries.map((b, i) => ({
    name: b.branchName.replace(" салбар", ""),
    value: b.revenue,
    color: BRANCH_COLORS[i % BRANCH_COLORS.length],
    pct: totalRevenue > 0 ? ((b.revenue / totalRevenue) * 100).toFixed(1) : "0"
  }));

  const tabs = [
    { key: "comparison" as const, label: "Харьцуулалт", icon: "ChartBarIcon" },
    { key: "trend" as const, label: "Хандлага", icon: "ArrowTrendingUpIcon" },
    { key: "breakdown" as const, label: "Задаргаа", icon: "TableCellsIcon" }
  ];

  return (
    <div className="space-y-4">
      <div className=" border border-primary/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
            <Icon name="BuildingStorefrontIcon" size={15} className="text-primary" />
          </div>
          <h2 className="text-sm font-bold text-foreground">Бүх Салбарын Нэгдсэн Тайлан</h2>
          <span className="ml-auto text-xs text-muted-foreground bg-card px-2 py-1 rounded-md border border-border">
            {summaries.length} салбар
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            {
              label: "Нийт Орлого",
              value: formatMNT(totalRevenue),
              icon: "BanknotesIcon",
              color: "text-blue-600"
            },
            {
              label: "Нийт Зардал",
              value: formatMNT(totalCosts),
              icon: "ArrowTrendingDownIcon",
              color: "text-red-500"
            },
            {
              label: "Нийт Ашиг",
              value: formatMNT(totalProfit),
              icon: "ChartBarIcon",
              color: "text-emerald-600"
            },
            {
              label: "Дундаж Маржин",
              value: `${avgMargin.toFixed(1)}%`,
              icon: "PercentBadgeIcon",
              color: "text-amber-600"
            },
            {
              label: "Нийт Захиалга",
              value: totalOrders.toLocaleString(),
              icon: "ShoppingCartIcon",
              color: "text-purple-600"
            }
          ].map((kpi) => (
            <div key={kpi.label} className="bg-card rounded-lg p-3 border border-border">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon name={kpi.icon} size={13} className={kpi.color} />
                <p className="text-[10px] text-muted-foreground font-medium">{kpi.label}</p>
              </div>
              <p className="text-sm font-bold text-foreground font-mono">{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-1 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
              activeTab === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon name={tab.icon} size={13} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "comparison" ? (
        <div className="bg-card border border-border rounded-lg shadow-card p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-foreground">Салбар Хоорондын Харьцуулалт</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Орлого, зардал, ашгийн харьцуулалт</p>
          </div>
          {loading ? (
            <div className="w-full h-64 skeleton rounded-lg" />
          ) : (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatMNT}
                    tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }}
                    axisLine={false}
                    tickLine={false}
                    width={72}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} iconType="square" iconSize={10} />
                  <Bar dataKey="Орлого" fill="#1E40AF" radius={[3, 3, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Зардал" fill="#94A3B8" radius={[3, 3, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Ашиг" fill="#059669" radius={[3, 3, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "trend" ? (
        <div className="bg-card border border-border rounded-lg shadow-card p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-foreground">Салбарын Орлогын Хандлага</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Сарын орлогын өөрчлөлт</p>
          </div>
          {loading ? (
            <div className="w-full h-64 skeleton rounded-lg" />
          ) : (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatMNT}
                    tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }}
                    axisLine={false}
                    tickLine={false}
                    width={72}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} iconType="square" iconSize={10} />
                  {summaries.map((b, i) => (
                    <Line
                      key={b.branchId}
                      type="monotone"
                      dataKey={b.branchName}
                      stroke={BRANCH_COLORS[i % BRANCH_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "breakdown" ? (
        <div className="bg-card border border-border rounded-lg shadow-card">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Салбар Тус Бүрийн Задаргаа</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Дэлгэрэнгүй санхүүгийн мэдээлэл</p>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">#</th>
                  <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">Салбар</th>
                  <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">Орлого</th>
                  <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">Зардал</th>
                  <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">Ашиг</th>
                  <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">Маржин</th>
                  <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">Өсөлт</th>
                  <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">Захиалга</th>
                  <th className="text-center px-3 py-2.5 text-muted-foreground font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((row, idx) => {
                  const sc = statusConfig[row.status];
                  const revPct = totalRevenue > 0 ? ((row.revenue / totalRevenue) * 100).toFixed(1) : "0";
                  return (
                    <tr key={row.branchId} className="border-t border-border hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground font-mono">{idx + 1}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: BRANCH_COLORS[idx % BRANCH_COLORS.length] }}
                          />
                          <span className="font-medium text-foreground">{row.branchName}</span>
                        </div>
                        <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden w-24">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${revPct}%`,
                              backgroundColor: BRANCH_COLORS[idx % BRANCH_COLORS.length]
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-foreground">{formatMNT(row.revenue)}</td>
                      <td className="px-3 py-3 text-right font-mono text-muted-foreground">{formatMNT(row.costs)}</td>
                      <td className="px-3 py-3 text-right font-mono text-emerald-700 font-medium">{formatMNT(row.profit)}</td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-foreground">{row.margin.toFixed(1)}%</td>
                      <td className="px-3 py-3 text-right">
                        <span
                          className={`flex items-center justify-end gap-0.5 font-medium ${
                            row.growth >= 0 ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          <Icon name={row.growth >= 0 ? "ArrowUpIcon" : "ArrowDownIcon"} size={11} />
                          {Math.abs(row.growth)}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-foreground">{row.orderCount.toLocaleString()}</td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${sc.bg} ${sc.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/50">
                  <td colSpan={2} className="px-4 py-3 text-xs font-bold text-foreground">
                    Нийт дүн
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-foreground">{formatMNT(totalRevenue)}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-muted-foreground">{formatMNT(totalCosts)}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700">{formatMNT(totalProfit)}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-foreground">{avgMargin.toFixed(1)}%</td>
                  <td colSpan={3} className="px-3 py-3 text-right font-mono font-bold text-foreground">
                    {totalOrders.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {breakdownData.map((b) => (
          <div key={b.name} className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: b.color }} />
              <span className="text-xs font-medium text-foreground truncate">{b.name}</span>
            </div>
            <p className="text-sm font-bold text-foreground font-mono">{formatMNT(b.value)}</p>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${b.pct}%`, backgroundColor: b.color }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{b.pct}% нийт орлогоос</p>
          </div>
        ))}
      </div>
    </div>
  );
}
