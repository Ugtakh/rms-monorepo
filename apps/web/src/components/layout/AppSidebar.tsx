"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { usePathname } from "next/navigation";
import {
  Command,
  BarChart3,
  Building2,
  ChefHat,
  FileText,
  LogOut,
  Map,
  MapPin,
  MonitorSmartphone,
  QrCode,
  Printer,
  ShoppingCart,
  Store,
  TabletSmartphone,
  UtensilsCrossed,
  Users,
  Warehouse
} from "lucide-react";
import { motion } from "framer-motion";
import { PERMISSIONS } from "@rms/shared";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";

const navItems: Array<{
  to: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  permission?: string;
}> = [
  { to: "/executive-overview", icon: BarChart3, label: "Executive" },
  { to: "/financial-analytics", icon: BarChart3, label: "Financial", permission: PERMISSIONS.REPORT_READ },
  { to: "/menu", icon: UtensilsCrossed, label: "Menu", permission: PERMISSIONS.MENU_READ },
  { to: "/operations-command-center", icon: Command, label: "Operations" },
  { to: "/pos", icon: ShoppingCart, label: "POS", permission: PERMISSIONS.ORDER_WRITE },
  { to: "/tablet-ordering-interface", icon: TabletSmartphone, label: "Tablet POS", permission: PERMISSIONS.ORDER_WRITE },
  { to: "/qr-menu-interface", icon: QrCode, label: "QR Menu", permission: PERMISSIONS.ORDER_WRITE },
  { to: "/kiosk-ordering-system", icon: MonitorSmartphone, label: "Kiosk", permission: PERMISSIONS.ORDER_WRITE },
  { to: "/kitchen-display-system", icon: ChefHat, label: "Kitchen", permission: PERMISSIONS.KDS_READ },
  { to: "/inventory", icon: Warehouse, label: "Агуулах", permission: PERMISSIONS.INVENTORY_READ },
  { to: "/printer-setup", icon: Printer, label: "Printer Setup", permission: PERMISSIONS.PAYMENT_WRITE },
  { to: "/ebarimt-settings", icon: FileText, label: "Ebarimt", permission: PERMISSIONS.BRANCH_WRITE },
  { to: "/floor-map", icon: Map, label: "Floor Map" },
  { to: "/employees", icon: Users, label: "Employees" },
  { to: "/reports", icon: BarChart3, label: "Тайлан", permission: PERMISSIONS.REPORT_READ }
];

export default function AppSidebar() {
  const pathname = usePathname();
  const {
    session,
    organizations,
    activeTenantId,
    hasPermission,
    setActiveTenant,
    logout
  } = useSession();

  const [switching, setSwitching] = useState(false);

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => (item.permission ? hasPermission(item.permission) : true)),
    [hasPermission]
  );

  if (!session) return null;

  const onTenantChange = async (value: string) => {
    const nextTenant = value.length > 0 ? value : null;
    setSwitching(true);
    await setActiveTenant(nextTenant);
    setSwitching(false);
  };

  return (
    <motion.aside
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="z-40 flex w-full flex-col border-b border-sidebar-border bg-sidebar lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:border-r lg:border-b-0"
    >
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-primary">
          <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-lg font-bold text-sidebar-accent-foreground">RMS Control</h1>
          <p className="text-xs text-sidebar-foreground">Enterprise Dashboard</p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3 border-b border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/80">{session.user.fullName}</div>

        <label className="block text-[11px] uppercase tracking-wide text-sidebar-foreground/70">
          <span className="mb-1 flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Organization</span>
          <select
            value={activeTenantId ?? ""}
            onChange={(event) => {
              void onTenantChange(event.target.value);
            }}
            disabled={switching || organizations.length === 0}
            className="w-full rounded-md border border-sidebar-border bg-sidebar-accent px-2.5 py-2 text-xs text-sidebar-accent-foreground outline-none focus:ring-1 focus:ring-primary"
          >
            {organizations.length === 0 ? (
              <option value="">No organization</option>
            ) : null}
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>

      </div>

      <nav className="px-3 py-3 lg:py-4 lg:flex-1 lg:overflow-y-auto">
        <div className="flex gap-1 overflow-x-auto lg:block lg:space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.to;
            return (
              <Link key={item.to} href={item.to} className="relative block min-w-max lg:min-w-0">
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  {isActive ? (
                    <motion.div
                      layoutId="sidebarActiveIndicator"
                      className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                    />
                  ) : null}
                  <item.icon className="h-4.5 w-4.5" />
                  <span className="font-medium">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-2 text-xs text-sidebar-foreground">
          <Store className="h-3.5 w-3.5" />
          <span>
            Role: {session.user.roles.join(", ") || "N/A"}
          </span>
        </div>
        <Button
          onClick={() => {
            void logout();
          }}
          variant="outline"
          className="w-full border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </motion.aside>
  );
}
