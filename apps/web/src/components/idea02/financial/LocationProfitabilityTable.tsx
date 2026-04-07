"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/idea02/AppIcon";

interface LocationRow {
  id: string;
  name: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  growth: number;
  rank: number;
  status: "excellent" | "good" | "average" | "poor";
}

const locationRows: LocationRow[] = [
  {
    id: "l1",
    name: "Төв салбар",
    revenue: 245000000,
    costs: 118000000,
    profit: 127000000,
    margin: 51.8,
    growth: 14.2,
    rank: 1,
    status: "excellent",
  },
  {
    id: "l2",
    name: "Баянгол",
    revenue: 187000000,
    costs: 95000000,
    profit: 92000000,
    margin: 49.2,
    growth: 11.7,
    rank: 2,
    status: "good",
  },
  {
    id: "l3",
    name: "Хан-Уул",
    revenue: 163000000,
    costs: 84000000,
    profit: 79000000,
    margin: 48.5,
    growth: 9.3,
    rank: 3,
    status: "good",
  },
  {
    id: "l4",
    name: "Сүхбаатар",
    revenue: 142000000,
    costs: 71000000,
    profit: 71000000,
    margin: 50.0,
    growth: 6.8,
    rank: 4,
    status: "average",
  },
  {
    id: "l5",
    name: "Налайх",
    revenue: 110000000,
    costs: 55000000,
    profit: 55000000,
    margin: 50.0,
    growth: 4.1,
    rank: 5,
    status: "average",
  },
];

const statusConfig = {
  excellent: {
    label: "Маш сайн",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
  },
  good: {
    label: "Сайн",
    color: "text-blue-700",
    bg: "bg-blue-50",
    dot: "bg-blue-500",
  },
  average: {
    label: "Дундаж",
    color: "text-amber-700",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
  },
  poor: {
    label: "Муу",
    color: "text-red-700",
    bg: "bg-red-50",
    dot: "bg-red-500",
  },
};

const formatMNT = (v: number) => {
  if (v >= 1000000000) return `₮${(v / 1000000000).toFixed(2)}Т`;
  if (v >= 1000000) return `₮${(v / 1000000).toFixed(0)} М`;
  return `₮${v.toLocaleString()}`;
};

type SortKey = "revenue" | "profit" | "margin" | "growth";

interface SortBtnProps {
  col: SortKey;
  sortKey: SortKey;
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
}

function SortBtn({ col, sortKey, sortAsc, onSort }: SortBtnProps) {
  return (
    <button
      onClick={() => onSort(col)}
      className="ml-1 inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
      aria-label={`Sort by ${col}`}
      type="button"
    >
      <Icon
        name={
          sortKey === col
            ? sortAsc
              ? "ChevronUpIcon"
              : "ChevronDownIcon"
            : "ChevronUpDownIcon"
        }
        size={12}
      />
    </button>
  );
}

export default function LocationProfitabilityTable() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(id);
  }, []);

  const sorted = [...locationRows].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortAsc ? diff : -diff;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-card flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          Салбарын Ашигт Ажиллагаа
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ашигт ажиллагаа болон өсөлтөөр эрэмбэлсэн
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
            <tr>
              <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">
                #
              </th>
              <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">
                Салбар
              </th>
              <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">
                Орлого
                <SortBtn
                  col="revenue"
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={handleSort}
                />
              </th>
              <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">
                Ашиг
                <SortBtn
                  col="profit"
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={handleSort}
                />
              </th>
              <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">
                Маржин
                <SortBtn
                  col="margin"
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={handleSort}
                />
              </th>
              <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">
                Өсөлт
                <SortBtn
                  col="growth"
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={handleSort}
                />
              </th>
              <th className="text-center px-3 py-2.5 text-muted-foreground font-medium">
                Статус
              </th>
            </tr>
          </thead>
          <tbody>
            {isHydrated
              ? sorted.map((row, idx) => {
                  const sc = statusConfig[row.status];
                  return (
                    <tr
                      key={row.id}
                      className="border-t border-border hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground font-mono">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-medium text-foreground">
                          {row.name}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-foreground">
                        {formatMNT(row.revenue)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-emerald-700 font-medium">
                        {formatMNT(row.profit)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="font-mono font-semibold text-foreground">
                          {row.margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span
                          className={`flex items-center justify-end gap-0.5 font-medium ${row.growth >= 0 ? "text-emerald-600" : "text-red-500"}`}
                        >
                          <Icon
                            name={
                              row.growth >= 0 ? "ArrowUpIcon" : "ArrowDownIcon"
                            }
                            size={11}
                          />
                          {Math.abs(row.growth)}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${sc.bg} ${sc.color}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                          />
                          {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              : Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-4 skeleton rounded" />
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t border-border bg-muted/30">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground">Нийт Орлого</p>
            <p className="text-xs font-mono font-bold text-foreground">
              ₮ 847 М
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Дундаж Маржин</p>
            <p className="text-xs font-mono font-bold text-emerald-700">
              49.9%
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Дундаж Өсөлт</p>
            <p className="text-xs font-mono font-bold text-blue-700">+9.2%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
