/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import Icon from "@/components/idea02/AppIcon";

interface PaymentMethod {
  name: string;
  value: number;
  amount: number;
  successRate: number;
  processingCost: number;
  color: string;
}

const paymentData: PaymentMethod[] = [
  {
    name: "Bank POS",
    value: 68,
    amount: 576000000,
    successRate: 99.2,
    processingCost: 1.2,
    color: "#1E40AF",
  },
  {
    name: "QPay",
    value: 32,
    amount: 271000000,
    successRate: 98.7,
    processingCost: 0.8,
    color: "#7C3AED",
  },
];

const hourlyData = [
  { hour: "08:00", bankPos: 12000000, qpay: 4500000 },
  { hour: "10:00", bankPos: 18000000, qpay: 7200000 },
  { hour: "12:00", bankPos: 45000000, qpay: 18000000 },
  { hour: "14:00", bankPos: 38000000, qpay: 15000000 },
  { hour: "16:00", bankPos: 22000000, qpay: 9000000 },
  { hour: "18:00", bankPos: 52000000, qpay: 21000000 },
  { hour: "20:00", bankPos: 48000000, qpay: 19000000 },
  { hour: "22:00", bankPos: 28000000, qpay: 11000000 },
];

const formatMNT = (v: number) => {
  if (v >= 1000000) return `₮${(v / 1000000).toFixed(0)}М`;
  return `₮${v.toLocaleString()}`;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const d = payload[0].payload as PaymentMethod;
  return (
    <div className="bg-card border border-border rounded-lg shadow-elevated p-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{d.name}</p>
      <p className="text-muted-foreground">
        Хувь:{" "}
        <span className="text-foreground font-mono font-medium">
          {d.value}%
        </span>
      </p>
      <p className="text-muted-foreground">
        Дүн:{" "}
        <span className="text-foreground font-mono font-medium">
          {formatMNT(d.amount)}
        </span>
      </p>
      <p className="text-muted-foreground">
        Амжилт:{" "}
        <span className="text-emerald-600 font-mono font-medium">
          {d.successRate}%
        </span>
      </p>
      <p className="text-muted-foreground">
        Шимтгэл:{" "}
        <span className="text-amber-600 font-mono font-medium">
          {d.processingCost}%
        </span>
      </p>
    </div>
  );
};

export default function PaymentMethodAnalytics() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="bg-card border border-border rounded-lg shadow-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Төлбөрийн Аргын Шинжилгээ
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bank POS ба QPay харьцуулалт
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-md">
          <Icon name="ClockIcon" size={12} />
          Өнөөдөр
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-3 text-center">
            Гүйлгээний Хуваарь
          </p>
          {isHydrated ? (
            <div className="w-full h-44" aria-label="Төлбөрийн аргын хуваарь">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              className="w-full h-44 skeleton rounded-full mx-auto"
              style={{ maxWidth: 176 }}
            />
          )}
          <div className="flex justify-center gap-4 mt-2">
            {paymentData.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-muted-foreground">{p.name}</span>
                <span className="font-mono font-semibold text-foreground">
                  {p.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          {paymentData.map((p) => (
            <div key={p.name} className="border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-sm font-semibold text-foreground">
                    {p.name}
                  </span>
                </div>
                <span className="text-sm font-mono font-bold text-foreground">
                  {formatMNT(p.amount)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted rounded p-2">
                  <p className="text-muted-foreground">Амжилтын хувь</p>
                  <p className="font-mono font-semibold text-emerald-700">
                    {p.successRate}%
                  </p>
                </div>
                <div className="bg-muted rounded p-2">
                  <p className="text-muted-foreground">Шимтгэл</p>
                  <p className="font-mono font-semibold text-amber-700">
                    {p.processingCost}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hourly Bar Chart */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Цагийн Гүйлгээний Хуваарь
        </p>
        {isHydrated ? (
          <div className="w-full h-36" aria-label="Цагийн гүйлгээний диаграм">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hourlyData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatMNT}
                  tick={{ fontSize: 9, fill: "var(--color-text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip formatter={(v: any) => formatMNT(v)} />
                <Legend
                  wrapperStyle={{ fontSize: "10px" }}
                  iconType="square"
                  iconSize={8}
                />
                <Bar
                  dataKey="bankPos"
                  name="Bank POS"
                  fill="#1E40AF"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={20}
                />
                <Bar
                  dataKey="qpay"
                  name="QPay"
                  fill="#7C3AED"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="w-full h-36 skeleton rounded-lg" />
        )}
      </div>
    </div>
  );
}
