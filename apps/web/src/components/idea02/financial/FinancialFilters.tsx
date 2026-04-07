"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/idea02/AppIcon";

interface FinancialFiltersProps {
  onExport: (format: "excel" | "pdf") => void;
  onBookmark: () => void;
  onSchedule: () => void;
}

const costCenters = [
  "Бүх төв",
  "Хоол үйлдвэрлэл",
  "Үйлчилгээ",
  "Захиргаа",
  "Маркетинг",
  "Логистик",
];
const locationGroups = ["Бүх салбар", "Хойд бүс", "Өмнөд бүс", "Төв бүс"];

export default function FinancialFilters({
  onExport,
  onBookmark,
  onSchedule,
}: FinancialFiltersProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [costCenter, setCostCenter] = useState("Бүх төв");
  const [locationGroup, setLocationGroup] = useState("Бүх салбар");
  const [currency, setCurrency] = useState<"MNT" | "USD">("MNT");
  const [fiscalView, setFiscalView] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(id);
  }, []);

  if (!isHydrated) {
    return <div className="h-12 skeleton rounded-lg" />;
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Cost Center */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium whitespace-nowrap">
            Зардлын төв:
          </label>
          <select
            value={costCenter}
            onChange={(e) => setCostCenter(e.target.value)}
            className="h-8 px-2.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {costCenters.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Location Group */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium whitespace-nowrap">
            Бүлэг:
          </label>
          <select
            value={locationGroup}
            onChange={(e) => setLocationGroup(e.target.value)}
            className="h-8 px-2.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {locationGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Currency Toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
          {(["MNT", "USD"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                currency === c
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c === "MNT" ? "₮ MNT" : "$ USD"}
            </button>
          ))}
        </div>

        {/* Fiscal Calendar Toggle */}
        <button
          onClick={() => setFiscalView((v) => !v)}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium border transition-all duration-200 ${
            fiscalView
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary"
          }`}
        >
          <Icon name="CalendarDaysIcon" size={13} />
          Санхүүгийн жил
        </button>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBookmark}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary transition-all duration-200"
          >
            <Icon name="BookmarkIcon" size={13} />
            <span className="hidden sm:inline">Хадгалах</span>
          </button>

          <button
            onClick={onSchedule}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary transition-all duration-200"
          >
            <Icon name="ClockIcon" size={13} />
            <span className="hidden sm:inline">Тайлан товлох</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all duration-200"
            >
              <Icon name="ArrowDownTrayIcon" size={13} />
              <span className="hidden sm:inline">Экспорт</span>
              <Icon
                name="ChevronDownIcon"
                size={11}
                className={`transition-transform duration-200 ${exportOpen ? "rotate-180" : ""}`}
              />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-elevated min-w-35 overflow-hidden">
                <button
                  onClick={() => {
                    onExport("excel");
                    setExportOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground hover:bg-muted transition-colors"
                >
                  <Icon
                    name="TableCellsIcon"
                    size={13}
                    className="text-emerald-600"
                  />
                  Excel (.xlsx)
                </button>
                <button
                  onClick={() => {
                    onExport("pdf");
                    setExportOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground hover:bg-muted transition-colors"
                >
                  <Icon
                    name="DocumentTextIcon"
                    size={13}
                    className="text-red-500"
                  />
                  PDF (Диаграмтай)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
