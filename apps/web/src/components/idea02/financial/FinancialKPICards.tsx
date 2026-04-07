"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/idea02/AppIcon";

interface KPICard {
  id: string;
  title: string;
  value: string;
  subValue?: string;
  trend: number;
  trendLabel: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  variance?: string;
  variancePositive?: boolean;
}

const kpiData: KPICard[] = [
  {
    id: "revenue",
    title: "Нийт Орлого",
    value: "₮ 847 320 000",
    subValue: "Энэ сар",
    trend: 12.4,
    trendLabel: "өмнөх сараас",
    icon: "BanknotesIcon",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    variance: "+₮ 93 450 000",
    variancePositive: true,
  },
  {
    id: "costs",
    title: "Нийт Зардал",
    value: "₮ 423 160 000",
    subValue: "Энэ сар",
    trend: -3.2,
    trendLabel: "өмнөх сараас",
    icon: "ArrowTrendingDownIcon",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    variance: "-₮ 13 940 000",
    variancePositive: true,
  },
  {
    id: "profit",
    title: "Цэвэр Ашиг",
    value: "₮ 424 160 000",
    subValue: "Маржин: 50.1%",
    trend: 8.7,
    trendLabel: "өмнөх сараас",
    icon: "ChartBarIcon",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    variance: "+₮ 33 980 000",
    variancePositive: true,
  },
  {
    id: "payment",
    title: "Төлбөрийн Хуваарь",
    value: "68% / 32%",
    subValue: "Bank POS / QPay",
    trend: 5.1,
    trendLabel: "QPay өсөлт",
    icon: "CreditCardIcon",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    variance: "+5.1% QPay",
    variancePositive: true,
  },
  {
    id: "inventory",
    title: "Нөөц Эргэлт",
    value: "4.2x",
    subValue: "Сарын дундаж",
    trend: -1.4,
    trendLabel: "өмнөх сараас",
    icon: "CubeIcon",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    variance: "-0.06x",
    variancePositive: false,
  },
  {
    id: "forecast",
    title: "Таамаглал",
    value: "₮ 912 000 000",
    subValue: "Дараа сар",
    trend: 7.6,
    trendLabel: "өнөөдрийн хандлага",
    icon: "SparklesIcon",
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    variance: "+₮ 64 680 000",
    variancePositive: true,
  },
];

export default function FinancialKPICards() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpiData.map((card) => (
        <div
          key={card.id}
          className="bg-card border border-border rounded-lg p-4 shadow-card hover:shadow-card-hover transition-all duration-250 hover-lift"
        >
          <div className="flex items-start justify-between mb-3">
            <div
              className={`w-9 h-9 rounded-md ${card.iconBg} flex items-center justify-center shrink-0`}
            >
              <Icon name={card.icon} size={18} className={card.iconColor} />
            </div>
            {isHydrated && (
              <span
                className={`flex items-center gap-0.5 text-xs font-medium ${card.trend >= 0 ? "text-emerald-600" : "text-red-500"}`}
              >
                <Icon
                  name={card.trend >= 0 ? "ArrowUpIcon" : "ArrowDownIcon"}
                  size={12}
                />
                {Math.abs(card.trend)}%
              </span>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground font-medium leading-tight">
              {card.title}
            </p>
            <p className="text-base font-bold text-foreground leading-tight font-mono">
              {card.value}
            </p>
            {card.subValue && (
              <p className="text-xs text-muted-foreground">{card.subValue}</p>
            )}
          </div>
          {isHydrated && card.variance && (
            <div
              className={`mt-2 pt-2 border-t border-border text-xs font-medium ${card.variancePositive ? "text-emerald-600" : "text-red-500"}`}
            >
              {card.variance}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">
            {card.trendLabel}
          </p>
        </div>
      ))}
    </div>
  );
}
