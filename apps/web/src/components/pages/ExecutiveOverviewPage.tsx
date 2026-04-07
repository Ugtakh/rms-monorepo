"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { DollarSign, ShoppingBag, TrendingUp, Clock, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import StatCard from "@/components/dashboard/StatCard";
import { rmsApi } from "@/lib/rms-api";
import { useSession } from "@/hooks/use-session";

function formatCurrency(amount: number) {
  return amount.toLocaleString() + "₮";
}

const openStatuses = new Set(["DRAFT", "SUBMITTED", "IN_PROGRESS", "READY", "SERVED"]);

export default function DashboardPage() {
  const {
    session,
    organizations,
    branches,
    activeTenantId,
    activeBranchId,
    setActiveTenant,
    setActiveBranch
  } = useSession();

  const summaryQuery = useQuery({
    queryKey: ["reports-summary", activeBranchId],
    queryFn: () => rmsApi.getReportSummary(activeBranchId ? { branchId: activeBranchId } : undefined),
    enabled: Boolean(session),
    refetchInterval: 20_000
  });

  const ordersQuery = useQuery({
    queryKey: ["orders", activeBranchId],
    queryFn: () => rmsApi.listOrders(),
    enabled: Boolean(session),
    refetchInterval: 5_000
  });

  const orders = ordersQuery.data ?? [];

  const topItems = useMemo(() => {
    const map = new Map<string, number>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        map.set(item.itemName, (map.get(item.itemName) ?? 0) + item.quantity);
      });
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders]);

  const hourlyRevenue = useMemo(() => {
    const byHour = new Map<string, number>();

    orders.forEach((order) => {
      const hour = new Date(order.createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
      byHour.set(hour, (byHour.get(hour) ?? 0) + order.totalAmount);
    });

    return Array.from(byHour.entries())
      .map(([hour, revenue]) => ({ hour, revenue }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }, [orders]);

  const totals = summaryQuery.data?.totals;
  const todayRevenue = totals?.totalAmount ?? 0;
  const todayOrders = totals?.orderCount ?? 0;
  const avgOrderValue = todayOrders > 0 ? todayRevenue / todayOrders : 0;
  const activeOrders = orders.filter((order) => openStatuses.has(order.status)).length;

  return (
    <div className="p-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-display font-bold text-foreground">Executive Overview</h1>
        <p className="text-muted-foreground mt-1">Бүх салбарын KPI ба realtime гүйцэтгэл</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.06 }}
        className="glass-card rounded-xl p-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm text-muted-foreground">
            Organization
            <select
              value={activeTenantId ?? ""}
              onChange={(event) => {
                const nextValue = event.target.value || null;
                void setActiveTenant(nextValue);
              }}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            >
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-muted-foreground">
            Branch
            <select
              value={activeBranchId ?? "__all"}
              onChange={(event) => {
                const next = event.target.value === "__all" ? null : event.target.value;
                setActiveBranch(next);
              }}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            >
              <option value="__all">Бүх салбар</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </motion.div>

      {!activeBranchId ? (
        <div className="glass-card rounded-xl p-4 flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <span>Бүх салбарын нийлбэр үзүүлэлт харагдаж байна.</span>
        </div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
      >
        <h2 className="text-xl font-display font-semibold text-foreground">Өнөөдрийн ерөнхий мэдээлэл</h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Өнөөдрийн орлого"
          value={formatCurrency(todayRevenue)}
          change={todayOrders > 0 ? "Live update" : "No orders yet"}
          changeType="up"
          icon={DollarSign}
          delay={0}
        />
        <StatCard
          title="Нийт захиалга"
          value={String(todayOrders)}
          change={todayOrders > 0 ? "Realtime" : "0"}
          changeType="up"
          icon={ShoppingBag}
          delay={0.1}
        />
        <StatCard
          title="Дундаж захиалга"
          value={formatCurrency(avgOrderValue)}
          change="Auto calculated"
          changeType="up"
          icon={TrendingUp}
          delay={0.2}
        />
        <StatCard
          title="Идэвхтэй захиалга"
          value={String(activeOrders)}
          icon={Clock}
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-2 glass-card rounded-xl p-6"
        >
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Цагийн орлого</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hourlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 90%)" />
              <XAxis dataKey="hour" tick={{ fontSize: 12, fill: "hsl(220 10% 50%)" }} />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(220 10% 50%)" }}
                tickFormatter={(value: number) => `${Math.round(value / 1000)}к`}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Орлого"]}
                contentStyle={{
                  backgroundColor: "hsl(0 0% 100%)",
                  border: "1px solid hsl(220 15% 90%)",
                  borderRadius: "8px",
                  fontSize: "13px"
                }}
              />
              <Bar dataKey="revenue" fill="hsl(25, 95%, 53%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="glass-card rounded-xl p-6"
        >
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Шилдэг хоолнууд</h2>
          <div className="space-y-4">
            {topItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.08 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                </div>
                <span className="text-sm text-muted-foreground font-mono">{item.count} ш</span>
              </motion.div>
            ))}
            {topItems.length === 0 ? <p className="text-sm text-muted-foreground">Өгөгдөл алга</p> : null}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="glass-card rounded-xl p-6"
      >
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">Сүүлийн захиалгууд</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Дугаар</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Ширээ</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Хоолнууд</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Нийт</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Төлөв</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 10).map((order) => (
                <tr key={order.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-foreground">{order.orderNo}</td>
                  <td className="py-3 px-4 text-foreground">{order.tableCode ?? "-"}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {order.items.map((item) => `${item.itemName} x${item.quantity}`).join(", ")}
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-foreground">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    SUBMITTED: "bg-warning/15 text-warning",
    IN_PROGRESS: "bg-info/15 text-info",
    READY: "bg-success/15 text-success",
    SERVED: "bg-primary/15 text-primary",
    CLOSED: "bg-muted text-muted-foreground",
    CANCELLED: "bg-destructive/15 text-destructive"
  };

  const labels: Record<string, string> = {
    DRAFT: "Ноорог",
    SUBMITTED: "Илгээгдсэн",
    IN_PROGRESS: "Бэлтгэж буй",
    READY: "Бэлэн",
    SERVED: "Үйлчилсэн",
    CLOSED: "Хаагдсан",
    CANCELLED: "Цуцлагдсан"
  };

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || ""}`}>
      {labels[status] || status}
    </span>
  );
}
