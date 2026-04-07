"use client";

import { useMemo, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ChefHat,
  Clock3,
  ReceiptText,
  Timer,
  Warehouse
} from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { rmsApi } from "@/lib/rms-api";

function formatCurrency(amount: number) {
  return `${amount.toLocaleString()}₮`;
}

const activeOrderStatuses = new Set(["DRAFT", "SUBMITTED", "IN_PROGRESS", "READY", "SERVED"]);

export default function OperationsCommandCenterPage() {
  const { session, activeBranchId } = useSession();

  const summaryQuery = useQuery({
    queryKey: ["reports-summary", activeBranchId],
    queryFn: () => rmsApi.getReportSummary(activeBranchId ? { branchId: activeBranchId } : undefined),
    enabled: Boolean(session),
    refetchInterval: 10_000
  });

  const ordersQuery = useQuery({
    queryKey: ["orders", activeBranchId],
    queryFn: () => rmsApi.listOrders(),
    enabled: Boolean(session),
    refetchInterval: 4_000
  });

  const kdsQuery = useQuery({
    queryKey: ["kds", activeBranchId],
    queryFn: () => rmsApi.listKds(),
    enabled: Boolean(session),
    refetchInterval: 3_000
  });

  const inventoryQuery = useQuery({
    queryKey: ["inventory", activeBranchId],
    queryFn: () => rmsApi.listInventory(),
    enabled: Boolean(session),
    refetchInterval: 20_000
  });

  const orders = ordersQuery.data ?? [];
  const kdsTickets = kdsQuery.data ?? [];
  const inventory = inventoryQuery.data ?? [];

  const metrics = useMemo(() => {
    const liveOrders = orders.filter((order) => activeOrderStatuses.has(order.status));
    const readyKds = kdsTickets.filter((ticket) => ticket.status === "READY");
    const lowStock = inventory.filter((item) => item.onHand <= item.reorderLevel);

    const stationLoad = Object.entries(
      kdsTickets.reduce<Record<string, number>>((acc, ticket) => {
        const station = ticket.station || "main";
        acc[station] = (acc[station] ?? 0) + 1;
        return acc;
      }, {})
    )
      .map(([station, count]) => ({ station, count }))
      .sort((a, b) => b.count - a.count);

    return {
      liveOrders,
      readyKds,
      lowStock,
      stationLoad
    };
  }, [orders, kdsTickets, inventory]);

  const totals = summaryQuery.data?.totals;
  const avgTicket = totals && totals.orderCount > 0 ? totals.totalAmount / totals.orderCount : 0;

  return (
    <div className="p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground">Operations Command Center</h1>
        <p className="text-muted-foreground mt-1">
          {activeBranchId ? "Сонгосон салбарын realtime үйл ажиллагаа" : "Бүх салбарын realtime үйл ажиллагаа"}
        </p>
      </motion.div>

      {!activeBranchId ? (
        <div className="glass-card rounded-xl p-4 flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <span>All-branch mode идэвхтэй.</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={ReceiptText}
          label="Идэвхтэй захиалга"
          value={String(metrics.liveOrders.length)}
          hint="POS + QR + Kiosk"
        />
        <MetricCard
          icon={ChefHat}
          label="Бэлэн болсон"
          value={String(metrics.readyKds.length)}
          hint="Pickup хүлээж буй"
        />
        <MetricCard
          icon={Activity}
          label="Өдрийн орлого"
          value={formatCurrency(totals?.totalAmount ?? 0)}
          hint={`Нийт ${totals?.orderCount ?? 0} захиалга`}
        />
        <MetricCard
          icon={Timer}
          label="Дундаж ticket"
          value={formatCurrency(avgTicket)}
          hint="Realtime auto"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-2 glass-card rounded-xl p-5"
        >
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Live Order Feed</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2.5 text-left text-muted-foreground font-medium">Order</th>
                  <th className="py-2.5 text-left text-muted-foreground font-medium">Status</th>
                  <th className="py-2.5 text-left text-muted-foreground font-medium">Items</th>
                  <th className="py-2.5 text-left text-muted-foreground font-medium">Amount</th>
                  <th className="py-2.5 text-left text-muted-foreground font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 12).map((order) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-muted/40">
                    <td className="py-3 font-mono text-foreground">{order.orderNo}</td>
                    <td className="py-3">
                      <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">{order.items.length}</td>
                    <td className="py-3 text-foreground font-medium">{formatCurrency(order.totalAmount)}</td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-xl p-5"
        >
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Station Load</h2>
          <div className="space-y-3">
            {metrics.stationLoad.length === 0 ? (
              <p className="text-sm text-muted-foreground">KDS queue хоосон байна.</p>
            ) : (
              metrics.stationLoad.map((row) => (
                <div key={row.station}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">{row.station.toUpperCase()}</span>
                    <span className="text-muted-foreground">{row.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.min(100, row.count * 20)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <h3 className="text-sm font-semibold text-foreground mt-6 mb-3 flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-warning" />
            Low Stock Alerts
          </h3>
          <div className="space-y-2">
            {metrics.lowStock.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm flex items-center justify-between"
              >
                <span className="text-foreground truncate">{item.name}</span>
                <span className="text-warning font-mono ml-2">
                  {item.onHand}/{item.reorderLevel}
                </span>
              </div>
            ))}
            {metrics.lowStock.length === 0 ? (
              <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                Нөөцийн эрсдэлгүй
              </div>
            ) : null}
          </div>
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl p-5"
      >
        <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-primary" />
          Kitchen Queue
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {kdsTickets.slice(0, 8).map((ticket) => (
            <div key={ticket.id} className="rounded-xl border border-border bg-background p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-foreground text-sm">{ticket.orderNo}</span>
                <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                  {ticket.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{ticket.items.length} item</p>
            </div>
          ))}
          {kdsTickets.length === 0 ? (
            <div className="rounded-xl border border-border bg-background p-3 text-sm text-muted-foreground col-span-full">
              KDS queue одоогоор хоосон байна.
            </div>
          ) : null}
        </div>
      </motion.section>

      {(ordersQuery.isError || kdsQuery.isError || inventoryQuery.isError) ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Зарим realtime өгөгдөл ачаалахад алдаа гарлаа.
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 text-2xl font-display font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </motion.div>
  );
}
