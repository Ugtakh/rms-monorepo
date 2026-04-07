"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/idea02/AppIcon";
import { useSession } from "@/hooks/use-session";
import AllBranchesFinancialView from "./AllBranchesFinancialView";
import CostBreakdownPanel from "./CostBreakdownPanel";
import FinancialFilters from "./FinancialFilters";
import FinancialKPICards from "./FinancialKPICards";
import LocationProfitabilityTable from "./LocationProfitabilityTable";
import PaymentMethodAnalytics from "./PaymentMethodAnalytics";
import RevenueProfitChart from "./RevenueProfitChart";

type MobileTab = "revenue" | "costs" | "profitability";

export default function FinancialInteractive() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("revenue");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { activeBranchId, branches } = useSession();

  useEffect(() => {
    const id = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(id);
  }, []);

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === activeBranchId) ?? null,
    [branches, activeBranchId]
  );

  const isAllBranches = activeBranchId === null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExport = (format: "excel" | "pdf") => {
    showToast(`${format.toUpperCase()} тайлан бэлтгэж байна...`);
  };

  const handleBookmark = () => {
    showToast("Харагдац хадгалагдлаа");
  };

  const handleSchedule = () => {
    showToast("Тайлан товлолт тохируулагдлаа");
  };

  const mobileTabs: { key: MobileTab; label: string; icon: string }[] = [
    { key: "revenue", label: "Орлого", icon: "BanknotesIcon" },
    { key: "costs", label: "Зардал", icon: "ArrowTrendingDownIcon" },
    { key: "profitability", label: "Ашигт ажиллагаа", icon: "ChartBarIcon" }
  ];

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-background">
      <div className="bg-card border-b border-border px-4 lg:px-6 py-4">
        <div className="max-w-400 mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <Icon name="CurrencyDollarIcon" size={16} className="text-primary" />
                </div>
                <h1 className="text-lg font-bold text-foreground">Санхүүгийн Шинжилгээ</h1>
                {isAllBranches ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    <Icon name="BuildingStorefrontIcon" size={11} />
                    Бүх салбар
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    <Icon name="MapPinIcon" size={11} />
                    {selectedBranch?.name ?? "Салбар"}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Орлого, зардал, ашигт ажиллагааны иж бүрэн тайлан • Сүүлд шинэчлэгдсэн: 02:30
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-md font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                Цаг тутам шинэчлэгддэг
              </span>
              <span className="bg-muted px-2.5 py-1.5 rounded-md">2026 оны 3-р сар</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-400 mx-auto px-4 lg:px-6 py-4 space-y-4">
        <FinancialFilters onExport={handleExport} onBookmark={handleBookmark} onSchedule={handleSchedule} />

        {isHydrated && isAllBranches ? (
          <AllBranchesFinancialView />
        ) : (
          <>
            <FinancialKPICards />

            {isHydrated ? (
              <div className="flex lg:hidden bg-card border border-border rounded-lg p-1 gap-1">
                {mobileTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setMobileTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                      mobileTab === tab.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon name={tab.icon} size={13} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="hidden lg:grid grid-cols-12 gap-4">
              <div className="col-span-8">
                <RevenueProfitChart />
              </div>
              <div className="col-span-4">
                <LocationProfitabilityTable />
              </div>
            </div>

            {isHydrated ? (
              <div className="lg:hidden">
                {mobileTab === "revenue" ? <RevenueProfitChart /> : null}
                {mobileTab === "costs" ? <CostBreakdownPanel /> : null}
                {mobileTab === "profitability" ? <LocationProfitabilityTable /> : null}
              </div>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PaymentMethodAnalytics />
              <CostBreakdownPanel />
            </div>
          </>
        )}

        <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Icon name="ShieldCheckIcon" size={13} className="text-emerald-600" />
            PCI DSS стандартад нийцсэн
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="LockClosedIcon" size={13} className="text-blue-600" />
            Шифрлэгдсэн дамжуулалт
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="ServerIcon" size={13} className="text-purple-600" />
            99.9% ажиллагааны баталгаа
          </span>
          <span className="ml-auto">© {new Date().getFullYear()} BIQ. Бүх эрх хуулиар хамгаалагдсан.</span>
        </div>
      </div>

      {isHydrated && toastMessage ? (
        <div className="fixed bottom-6 right-6 z-200 bg-foreground text-background px-4 py-3 rounded-lg shadow-elevated text-sm font-medium flex items-center gap-2 animate-pulse-dot">
          <Icon name="CheckCircleIcon" size={16} className="text-emerald-400" />
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
