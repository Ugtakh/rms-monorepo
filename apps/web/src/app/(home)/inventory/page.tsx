"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, ArrowUpDown, Package, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";
import { rmsApi } from "@/lib/rms-api";
import type { InventoryItemRecord } from "@/types/rms";

type CreateForm = {
  sku: string;
  name: string;
  unit: string;
  onHand: string;
  reorderLevel: string;
  averageCost: string;
};

type AdjustForm = {
  id: string;
  movementType: "IN" | "OUT" | "ADJUSTMENT";
  quantity: string;
  unitCost: string;
  note: string;
};

const EMPTY_CREATE: CreateForm = {
  sku: "",
  name: "",
  unit: "kg",
  onHand: "0",
  reorderLevel: "0",
  averageCost: "0"
};

const EMPTY_ADJUST: AdjustForm = {
  id: "",
  movementType: "IN",
  quantity: "1",
  unitCost: "",
  note: ""
};

function toCurrency(amount: number): string {
  return `${Math.round(amount).toLocaleString("mn-MN")}₮`;
}

function toDateLabel(value?: string): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("mn-MN");
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { activeBranchId } = useSession();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "quantity">("name");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [adjustForm, setAdjustForm] = useState<AdjustForm>(EMPTY_ADJUST);

  const inventoryQuery = useQuery({
    queryKey: ["inventory", activeBranchId],
    queryFn: () => rmsApi.listInventory(),
    enabled: Boolean(activeBranchId),
    refetchInterval: 15_000
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const onHand = Number(createForm.onHand);
      const reorderLevel = Number(createForm.reorderLevel);
      const averageCost = Number(createForm.averageCost);

      if (
        !createForm.sku.trim() ||
        !createForm.name.trim() ||
        !createForm.unit.trim() ||
        !Number.isFinite(onHand) ||
        !Number.isFinite(reorderLevel) ||
        !Number.isFinite(averageCost)
      ) {
        throw new Error("Create form талбаруудаа зөв бөглөнө үү");
      }

      return rmsApi.createInventory({
        sku: createForm.sku.trim(),
        name: createForm.name.trim(),
        unit: createForm.unit.trim(),
        onHand,
        reorderLevel,
        averageCost
      });
    },
    onSuccess: () => {
      toast.success("Inventory item амжилттай нэмэгдлээ");
      setCreateForm(EMPTY_CREATE);
      setShowCreateForm(false);
      void queryClient.invalidateQueries({ queryKey: ["inventory", activeBranchId] });
    },
    onError: (error) => {
      toast.error((error as Error).message || "Inventory item нэмэхэд алдаа гарлаа");
    }
  });

  const adjustMutation = useMutation({
    mutationFn: () => {
      if (!adjustForm.id) {
        throw new Error("Эхлээд inventory item сонгоно уу");
      }

      const quantity = Number(adjustForm.quantity);
      const unitCost = adjustForm.unitCost.length > 0 ? Number(adjustForm.unitCost) : undefined;

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("Тоо хэмжээ зөв оруулна уу");
      }

      if (unitCost !== undefined && (!Number.isFinite(unitCost) || unitCost < 0)) {
        throw new Error("Unit cost зөв оруулна уу");
      }

      return rmsApi.adjustInventory({
        id: adjustForm.id,
        movementType: adjustForm.movementType,
        quantity,
        unitCost,
        note: adjustForm.note.trim() || undefined
      });
    },
    onSuccess: () => {
      toast.success("Stock adjustment амжилттай");
      setAdjustForm(EMPTY_ADJUST);
      void queryClient.invalidateQueries({ queryKey: ["inventory", activeBranchId] });
      void queryClient.invalidateQueries({ queryKey: ["reports-summary", activeBranchId] });
    },
    onError: (error) => {
      toast.error((error as Error).message || "Stock adjustment хийхэд алдаа гарлаа");
    }
  });

  const inventoryItems = inventoryQuery.data ?? [];

  const filteredItems = useMemo(
    () =>
      inventoryItems
        .filter((item) => {
          const bySearch =
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.sku.toLowerCase().includes(search.toLowerCase());
          const byLow = !lowStockOnly || item.onHand <= item.reorderLevel;
          return bySearch && byLow;
        })
        .sort((a, b) => (sortBy === "name" ? a.name.localeCompare(b.name) : a.onHand - b.onHand)),
    [inventoryItems, search, lowStockOnly, sortBy]
  );

  const summary = useMemo(() => {
    const low = inventoryItems.filter((item) => item.onHand <= item.reorderLevel).length;
    const totalValue = inventoryItems.reduce((sum, item) => sum + item.onHand * item.averageCost, 0);
    return { low, totalValue, total: inventoryItems.length };
  }, [inventoryItems]);

  if (!activeBranchId) {
    return (
      <div className="p-8">
        <div className="glass-card rounded-xl p-8 flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <span>Inventory харахын тулд эхлээд branch сонгоно уу.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Inventory Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Real stock, create item, adjustment workflow</p>
        </div>
        <button
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {showCreateForm ? "Close Create" : "Create Item"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass-card rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Нийт бараа</p>
          <p className="text-xl font-bold text-foreground mt-1">{summary.total}</p>
        </div>
        <div className="glass-card rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Low stock</p>
          <p className="text-xl font-bold text-warning mt-1">{summary.low}</p>
        </div>
        <div className="glass-card rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Агуулахын дүн</p>
          <p className="text-xl font-bold text-foreground mt-1">{toCurrency(summary.totalValue)}</p>
        </div>
      </div>

      {showCreateForm ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-foreground">Create Inventory Item</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input value={createForm.sku} onChange={(event) => setCreateForm((prev) => ({ ...prev, sku: event.target.value }))} placeholder="SKU" />
            <Input value={createForm.name} onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Name" />
            <Input value={createForm.unit} onChange={(event) => setCreateForm((prev) => ({ ...prev, unit: event.target.value }))} placeholder="Unit (kg, pcs)" />
            <Input type="number" min={0} step="0.001" value={createForm.onHand} onChange={(event) => setCreateForm((prev) => ({ ...prev, onHand: event.target.value }))} placeholder="Opening stock" />
            <Input type="number" min={0} step="0.001" value={createForm.reorderLevel} onChange={(event) => setCreateForm((prev) => ({ ...prev, reorderLevel: event.target.value }))} placeholder="Reorder level" />
            <Input type="number" min={0} step="0.01" value={createForm.averageCost} onChange={(event) => setCreateForm((prev) => ({ ...prev, averageCost: event.target.value }))} placeholder="Avg cost" />
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            Save Item
          </button>
        </motion.div>
      ) : null}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-5 space-y-3">
        <h2 className="text-base font-semibold text-foreground">Stock Adjustment</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            value={adjustForm.id}
            onChange={(event) => setAdjustForm((prev) => ({ ...prev, id: event.target.value }))}
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
          >
            <option value="">Select item</option>
            {inventoryItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.sku})
              </option>
            ))}
          </select>

          <select
            value={adjustForm.movementType}
            onChange={(event) =>
              setAdjustForm((prev) => ({ ...prev, movementType: event.target.value as AdjustForm["movementType"] }))
            }
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
          >
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
          </select>

          <Input
            type="number"
            min={0}
            step="0.001"
            value={adjustForm.quantity}
            onChange={(event) => setAdjustForm((prev) => ({ ...prev, quantity: event.target.value }))}
            placeholder="Quantity"
          />
          <Input
            type="number"
            min={0}
            step="0.01"
            value={adjustForm.unitCost}
            onChange={(event) => setAdjustForm((prev) => ({ ...prev, unitCost: event.target.value }))}
            placeholder="Unit cost (optional)"
          />
          <Input
            value={adjustForm.note}
            onChange={(event) => setAdjustForm((prev) => ({ ...prev, note: event.target.value }))}
            placeholder="Note (optional)"
          />
        </div>
        <button
          onClick={() => adjustMutation.mutate()}
          disabled={adjustMutation.isPending}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          Apply Adjustment
        </button>
      </motion.div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search inventory" className="pl-9" />
        </div>
        <button
          onClick={() => setSortBy((prev) => (prev === "name" ? "quantity" : "name"))}
          className="h-10 px-4 rounded-lg border border-border bg-card text-sm text-muted-foreground inline-flex items-center gap-2"
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortBy === "name" ? "Sort: Name" : "Sort: Quantity"}
        </button>
        <button
          onClick={() => setLowStockOnly((prev) => !prev)}
          className={`h-10 px-4 rounded-lg border text-sm ${lowStockOnly ? "border-warning text-warning bg-warning/10" : "border-border text-muted-foreground bg-card"}`}
        >
          Low stock only
        </button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4">Item</th>
              <th className="text-left py-3 px-4">SKU</th>
              <th className="text-left py-3 px-4">On hand</th>
              <th className="text-left py-3 px-4">Avg cost</th>
              <th className="text-left py-3 px-4">Total value</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const low = item.onHand <= item.reorderLevel;
              return (
                <tr
                  key={item.id}
                  className="border-b border-border/50 hover:bg-muted/20 cursor-pointer"
                  onClick={() =>
                    setAdjustForm((prev) => ({
                      ...prev,
                      id: item.id,
                      movementType: "IN",
                      quantity: "1"
                    }))
                  }
                >
                  <td className="py-3 px-4 font-medium text-foreground">{item.name}</td>
                  <td className="py-3 px-4 text-muted-foreground font-mono">{item.sku}</td>
                  <td className="py-3 px-4 text-foreground font-mono">
                    {item.onHand} {item.unit}
                  </td>
                  <td className="py-3 px-4 text-foreground font-mono">{toCurrency(item.averageCost)}</td>
                  <td className="py-3 px-4 text-foreground font-mono">{toCurrency(item.onHand * item.averageCost)}</td>
                  <td className="py-3 px-4">
                    {low ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-warning/10 text-warning">
                        <AlertTriangle className="w-3 h-3" /> Low
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 rounded-full text-xs bg-success/10 text-success">OK</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{toDateLabel(item.updatedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
