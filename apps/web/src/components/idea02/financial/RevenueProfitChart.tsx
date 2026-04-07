/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Icon from "@/components/idea02/AppIcon";

type DrillDimension = "location" | "category" | "time";

interface ChartDataPoint {
  name: string;
  орлого: number;
  зардал: number;
  ашиг: number;
  маржин: number;
}

const locationData: ChartDataPoint[] = [
  {
    name: "Төв салбар",
    орлого: 245000000,
    зардал: 118000000,
    ашиг: 127000000,
    маржин: 51.8,
  },
  {
    name: "Баянгол",
    орлого: 187000000,
    зардал: 95000000,
    ашиг: 92000000,
    маржин: 49.2,
  },
  {
    name: "Хан-Уул",
    орлого: 163000000,
    зардал: 84000000,
    ашиг: 79000000,
    маржин: 48.5,
  },
  {
    name: "Сүхбаатар",
    орлого: 142000000,
    зардал: 71000000,
    ашиг: 71000000,
    маржин: 50.0,
  },
  {
    name: "Налайх",
    орлого: 110000000,
    зардал: 55000000,
    ашиг: 55000000,
    маржин: 50.0,
  },
];

const categoryData: ChartDataPoint[] = [
  {
    name: "Үндсэн хоол",
    орлого: 312000000,
    зардал: 156000000,
    ашиг: 156000000,
    маржин: 50.0,
  },
  {
    name: "Ундаа",
    орлого: 198000000,
    зардал: 79000000,
    ашиг: 119000000,
    маржин: 60.1,
  },
  {
    name: "Зууш",
    орлого: 145000000,
    зардал: 72000000,
    ашиг: 73000000,
    маржин: 50.3,
  },
  {
    name: "Десерт",
    орлого: 112000000,
    зардал: 67000000,
    ашиг: 45000000,
    маржин: 40.2,
  },
  {
    name: "Коктейль",
    орлого: 80000000,
    зардал: 49000000,
    ашиг: 31000000,
    маржин: 38.8,
  },
];

const timeData: ChartDataPoint[] = [
  {
    name: "1-р сар",
    орлого: 698000000,
    зардал: 349000000,
    ашиг: 349000000,
    маржин: 50.0,
  },
  {
    name: "2-р сар",
    орлого: 723000000,
    зардал: 361000000,
    ашиг: 362000000,
    маржин: 50.1,
  },
  {
    name: "3-р сар",
    орлого: 756000000,
    зардал: 378000000,
    ашиг: 378000000,
    маржин: 50.0,
  },
  {
    name: "4-р сар",
    орлого: 812000000,
    зардал: 406000000,
    ашиг: 406000000,
    маржин: 50.0,
  },
  {
    name: "5-р сар",
    орлого: 847000000,
    зардал: 423000000,
    ашиг: 424000000,
    маржин: 50.1,
  },
  {
    name: "6-р сар (таамаглал)",
    орлого: 912000000,
    зардал: 445000000,
    ашиг: 467000000,
    маржин: 51.2,
  },
];

const dataMap: Record<DrillDimension, ChartDataPoint[]> = {
  location: locationData,
  category: categoryData,
  time: timeData,
};

const formatMNT = (value: number) => {
  if (value >= 1000000000) return `₮${(value / 1000000000).toFixed(1)}Т`;
  if (value >= 1000000) return `₮${(value / 1000000).toFixed(0)}М`;
  return `₮${value.toLocaleString()}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-elevated p-3 min-w-50">
      <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div
          key={entry.dataKey}
          className="flex items-center justify-between gap-4 text-xs mb-1"
        >
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
          </span>
          <span className="font-mono font-medium text-foreground">
            {entry.dataKey === "маржин"
              ? `${entry.value}%`
              : formatMNT(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function RevenueProfitChart() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [dimension, setDimension] = useState<DrillDimension>("time");

  useEffect(() => {
    const id = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(id);
  }, []);

  const data = dataMap[dimension];

  const dimensionLabels: Record<DrillDimension, string> = {
    location: "Салбараар",
    category: "Ангиллаар",
    time: "Цагийн хугацаагаар",
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-card h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Орлого ба Ашгийн Шинжилгээ
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Хоёр тэнхлэгт нэгдсэн диаграм
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-md p-1">
          {(Object.keys(dimensionLabels) as DrillDimension[]).map((dim) => (
            <button
              key={dim}
              onClick={() => setDimension(dim)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                dimension === dim
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {dimensionLabels[dim]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 min-h-0">
        {isHydrated ? (
          <div
            className="w-full h-72"
            aria-label="Орлого ба ашгийн нэгдсэн диаграм"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={formatMNT}
                  tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                  width={72}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  iconType="square"
                  iconSize={10}
                />
                <Bar
                  yAxisId="left"
                  dataKey="орлого"
                  name="Орлого"
                  fill="#1E40AF"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={48}
                />
                <Bar
                  yAxisId="left"
                  dataKey="зардал"
                  name="Зардал"
                  fill="#94A3B8"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={48}
                />
                <Bar
                  yAxisId="left"
                  dataKey="ашиг"
                  name="Ашиг"
                  fill="#059669"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={48}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="маржин"
                  name="Маржин %"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#F59E0B", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="w-full h-72 skeleton rounded-lg" />
        )}
      </div>

      <div className="px-4 pb-3 flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
        <span className="flex items-center gap-1.5">
          <Icon name="ClockIcon" size={12} />
          Цаг тутам шинэчлэгддэг
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="InformationCircleIcon" size={12} />
          Таамаглалын утгууд тасархай шугамаар харагдана
        </span>
      </div>
    </div>
  );
}
