/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import Icon from "@/components/idea02/AppIcon";

interface CostItem {
  category: string;
  amount: number;
  percentage: number;
  budget: number;
  variance: number;
  icon: string;
  color: string;
}

const costItems: CostItem[] = [
  {
    category: "Түүхий эд",
    amount: 169264000,
    percentage: 40.0,
    budget: 165000000,
    variance: 2.6,
    icon: "CubeIcon",
    color: "text-blue-600",
  },
  {
    category: "Цалин хөлс",
    amount: 101558400,
    percentage: 24.0,
    budget: 100000000,
    variance: 1.6,
    icon: "UsersIcon",
    color: "text-purple-600",
  },
  {
    category: "Түрээс",
    amount: 63473750,
    percentage: 15.0,
    budget: 63000000,
    variance: 0.8,
    icon: "BuildingOfficeIcon",
    color: "text-amber-600",
  },
  {
    category: "Коммунал",
    amount: 42315833,
    percentage: 10.0,
    budget: 45000000,
    variance: -6.0,
    icon: "BoltIcon",
    color: "text-emerald-600",
  },
  {
    category: "Маркетинг",
    amount: 25389500,
    percentage: 6.0,
    budget: 28000000,
    variance: -9.3,
    icon: "MegaphoneIcon",
    color: "text-pink-600",
  },
  {
    category: "Бусад",
    amount: 21157917,
    percentage: 5.0,
    budget: 22000000,
    variance: -3.8,
    icon: "EllipsisHorizontalCircleIcon",
    color: "text-slate-600",
  },
];

const radarData = costItems.map((c) => ({
  subject: c.category,
  Бодит: c.percentage,
  Төсөв: (c.budget / 423160000) * 100,
}));

const formatMNT = (v: number) => `₮${(v / 1000000).toFixed(1)} М`;

export default function CostBreakdownPanel() {
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
            Зардлын Задаргаа
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Төсөвтэй харьцуулсан бодит зардал
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1.5 rounded-md">
          <Icon name="ChartBarSquareIcon" size={12} />
          Нийт: ₮ 423 М
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar Chart */}
        <div>
          {isHydrated ? (
            <div className="w-full h-52" aria-label="Зардлын радар диаграм">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }}
                  />
                  <Radar
                    name="Бодит"
                    dataKey="Бодит"
                    stroke="#1E40AF"
                    fill="#1E40AF"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Төсөв"
                    dataKey="Төсөв"
                    stroke="#F59E0B"
                    fill="#F59E0B"
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />

                  <Tooltip formatter={(v: any) => `${v.toFixed(1)}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-full h-52 skeleton rounded-full" />
          )}
          <div className="flex justify-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-0.5 bg-blue-700 rounded" />
              Бодит
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-0.5 bg-amber-500 rounded border-dashed" />
              Төсөв
            </span>
          </div>
        </div>

        {/* Cost List */}
        <div className="space-y-2">
          {costItems.map((item) => (
            <div key={item.category} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Icon name={item.icon} size={14} className={item.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground truncate">
                    {item.category}
                  </span>
                  <span className="text-xs font-mono text-foreground ml-2 shrink-0">
                    {formatMNT(item.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {item.percentage}%
                  </span>
                  {isHydrated && (
                    <span
                      className={`text-[10px] font-medium shrink-0 ${item.variance > 0 ? "text-red-500" : "text-emerald-600"}`}
                    >
                      {item.variance > 0 ? "+" : ""}
                      {item.variance}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
