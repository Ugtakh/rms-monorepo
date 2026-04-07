"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, ArrowDownRight, ArrowUpRight, BarChart3, Download, PieChart, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { rmsApi } from "@/lib/rms-api";

function formatCurrency(amount: number) {
  return (amount / 1000000).toFixed(1) + "сая₮";
}

function ymd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const COLORS = ["hsl(25, 95%, 53%)", "hsl(160, 60%, 45%)", "hsl(210, 80%, 55%)", "hsl(45, 93%, 47%)"];

export default function ReportsPage() {
  const { session, activeBranchId } = useSession();

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
    refetchInterval: 10_000
  });

  const menuQuery = useQuery({
    queryKey: ["menu", activeBranchId],
    queryFn: () => rmsApi.listMenu(),
    enabled: Boolean(session),
    refetchInterval: 30_000
  });

  const orders = ordersQuery.data ?? [];
  const menu = menuQuery.data ?? [];

  const menuCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    menu.forEach((item) => map.set(item.id, item.category));
    return map;
  }, [menu]);

  const reportData = useMemo(() => {
    const now = new Date();

    const dailyRevenue = Array.from({ length: 7 }, (_, idx) => {
      const day = addDays(now, idx - 6);
      const key = ymd(day);
      const dailyOrders = orders.filter((order) => ymd(new Date(order.createdAt)) === key);
      return {
        date: day.toLocaleDateString("mn-MN", { month: "2-digit", day: "2-digit" }),
        revenue: dailyOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        orders: dailyOrders.length
      };
    });

    const weeklyComparison = Array.from({ length: 7 }, (_, idx) => {
      const thisDay = addDays(now, idx - 6);
      const prevDay = addDays(thisDay, -7);
      const thisKey = ymd(thisDay);
      const prevKey = ymd(prevDay);

      const thisWeek = orders
        .filter((order) => ymd(new Date(order.createdAt)) === thisKey)
        .reduce((sum, order) => sum + order.totalAmount, 0);

      const lastWeek = orders
        .filter((order) => ymd(new Date(order.createdAt)) === prevKey)
        .reduce((sum, order) => sum + order.totalAmount, 0);

      return {
        day: thisDay.toLocaleDateString("en-US", { weekday: "short" }),
        thisWeek,
        lastWeek
      };
    });

    const categoryMap = new Map<string, number>();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const category = menuCategoryMap.get(item.menuItemId) ?? "Бусад";
        categoryMap.set(category, (categoryMap.get(category) ?? 0) + item.lineTotal);
      });
    });

    const categoryTotal = Array.from(categoryMap.values()).reduce((sum, value) => sum + value, 0);
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: categoryTotal > 0 ? Math.round((amount / categoryTotal) * 100) : 0
    }));

    const hourlyMap = new Map<string, number>();
    orders.forEach((order) => {
      const hour = new Date(order.createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
      hourlyMap.set(hour, (hourlyMap.get(hour) ?? 0) + order.totalAmount);
    });

    const hourlyRevenue = Array.from(hourlyMap.entries())
      .map(([hour, revenue]) => ({ hour, revenue }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    return {
      dailyRevenue,
      weeklyComparison,
      categoryBreakdown,
      hourlyRevenue
    };
  }, [orders, menuCategoryMap]);

  const totals = summaryQuery.data?.totals;
  const totalRevenue = totals?.totalAmount ?? 0;
  const totalOrders = totals?.orderCount ?? 0;
  const avgPerDay = totalRevenue / 7;

  return (
    <div className="p-8 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-primary" />
              Financial Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              {activeBranchId ? "Сонгосон салбарын 7 хоногийн тайлан" : "Бүх салбарын нэгдсэн 7 хоногийн тайлан"}
            </p>
          </div>
          <Button variant="outline" className="text-sm">
            <Download className="w-4 h-4 mr-2" /> Тайлан татах
          </Button>
        </div>
      </motion.div>

      {!activeBranchId ? (
        <div className="glass-card rounded-xl p-4 flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <span>All-branch view: бүх салбарын нийлбэр KPI тооцоолж байна.</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: "7 хоногийн орлого", value: formatCurrency(totalRevenue), change: "+", up: true },
          { label: "Нийт захиалга", value: String(totalOrders), change: "+", up: true },
          { label: "Өдрийн дундаж", value: formatCurrency(avgPerDay), change: "-", up: false }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card rounded-xl p-5"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <div className="flex items-end justify-between mt-2">
              <span className="text-2xl font-display font-bold text-foreground">{stat.value}</span>
              <span className={`flex items-center gap-0.5 text-xs font-medium ${stat.up ? "text-success" : "text-destructive"}`}>
                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Өдөр тутмын орлого
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={reportData.dailyRevenue}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 90%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(220 10% 50%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(220 10% 50%)" }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}сая`} />
              <Tooltip formatter={(value: number) => [`${value.toLocaleString()}₮`, "Орлого"]} contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(220 15% 90%)", borderRadius: "8px", fontSize: "13px" }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(25, 95%, 53%)" fill="url(#revenueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">7 хоног харьцуулалт</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={reportData.weeklyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 90%)" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(220 10% 50%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(220 10% 50%)" }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}`} />
              <Tooltip formatter={(value: number) => [`${value.toLocaleString()}₮`]} contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(220 15% 90%)", borderRadius: "8px", fontSize: "13px" }} />
              <Bar dataKey="lastWeek" fill="hsl(220 15% 85%)" radius={[4, 4, 0, 0]} name="Өнгөрсөн 7 хоног" />
              <Bar dataKey="thisWeek" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} name="Энэ 7 хоног" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" /> Ангилалаар
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <RePieChart>
              <Pie data={reportData.categoryBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="amount" nameKey="category" paddingAngle={3}>
                {reportData.categoryBreakdown.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value.toLocaleString()}₮`]} contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(220 15% 90%)", borderRadius: "8px", fontSize: "13px" }} />
              <Legend />
            </RePieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Цагийн чиг хандлага</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={reportData.hourlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 90%)" />
              <XAxis dataKey="hour" tick={{ fontSize: 12, fill: "hsl(220 10% 50%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(220 10% 50%)" }} tickFormatter={(v: number) => `${Math.round(v / 1000)}к`} />
              <Tooltip formatter={(value: number) => [`${value.toLocaleString()}₮`, "Орлого"]} contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(220 15% 90%)", borderRadius: "8px", fontSize: "13px" }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(160, 60%, 45%)" strokeWidth={2} dot={{ fill: "hsl(160, 60%, 45%)", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
