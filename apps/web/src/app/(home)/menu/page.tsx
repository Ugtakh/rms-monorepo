"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { PERMISSIONS } from "@rms/shared";
import { Edit3, Plus, Save, Search, UtensilsCrossed, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { useSession } from "@/hooks/use-session";
import { rmsApi } from "@/lib/rms-api";
import type { InventoryItemRecord, MenuItemRecord } from "@/types/rms";

type IngredientDraft = {
  inventoryItemId: string;
  quantity: string;
  wastePercent: string;
};

type ServiceWindowDraft = {
  label: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  enabled: boolean;
};

type MenuFormState = {
  category: string;
  sku: string;
  name: string;
  description: string;
  price: string;
  prepStation: string;
  tags: string;
  available: boolean;
  isSeasonal: boolean;
  seasonStartDate: string;
  seasonEndDate: string;
  ingredients: IngredientDraft[];
  serviceWindows: ServiceWindowDraft[];
};

const EMPTY_FORM: MenuFormState = {
  category: "Main",
  sku: "",
  name: "",
  description: "",
  price: "",
  prepStation: "main",
  tags: "",
  available: true,
  isSeasonal: false,
  seasonStartDate: "",
  seasonEndDate: "",
  ingredients: [],
  serviceWindows: []
};

const DAY_OPTIONS: Array<{ id: number; label: string }> = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
  { id: 7, label: "Sun" }
];

function normalizeTags(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function buildFoodCost(menuItem: MenuItemRecord, inventoryMap: Map<string, InventoryItemRecord>): number {
  return menuItem.ingredients.reduce((sum, ingredient) => {
    const stock = inventoryMap.get(ingredient.inventoryItemId);
    if (!stock) return sum;

    const waste = ingredient.wastePercent ?? 0;
    const effectiveQty = ingredient.quantity * (1 + waste / 100);
    return sum + effectiveQty * stock.averageCost;
  }, 0);
}

function toCurrency(value: number): string {
  return `${Math.round(value).toLocaleString("mn-MN")}₮`;
}

function toIsoDateBoundary(value: string, endOfDay: boolean): string | undefined {
  if (value.length === 0) return undefined;
  return `${value}T${endOfDay ? "23:59:59.000" : "00:00:00.000"}Z`;
}

function toDateInput(value?: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function summarizeWindow(window: {
  label?: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
}): string {
  const days = window.daysOfWeek
    .slice()
    .sort((a, b) => a - b)
    .map((day) => DAY_OPTIONS.find((option) => option.id === day)?.label ?? String(day))
    .join(",");
  const label = window.label && window.label.length > 0 ? window.label : "Window";
  return `${label} ${days} ${window.startTime}-${window.endTime}`;
}

export default function MenuManagementPage() {
  const queryClient = useQueryClient();
  const { activeBranchId, hasPermission } = useSession();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuFormState>(EMPTY_FORM);

  const canWrite = hasPermission(PERMISSIONS.MENU_WRITE);

  const menuQuery = useQuery({
    queryKey: ["menu", activeBranchId, "management"],
    queryFn: () => rmsApi.listMenu(),
    enabled: Boolean(activeBranchId),
    refetchInterval: 20_000
  });

  const inventoryQuery = useQuery({
    queryKey: ["inventory", activeBranchId, "menu-builder"],
    queryFn: () => rmsApi.listInventory(),
    enabled: Boolean(activeBranchId),
    refetchInterval: 30_000
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const price = Number(form.price);
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("Үнэ зөв оруулна уу");
      }

      return rmsApi.createMenu({
        category: form.category.trim(),
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price,
        prepStation: form.prepStation.trim() || undefined,
        tags: normalizeTags(form.tags),
        available: form.available,
        isSeasonal: form.isSeasonal,
        seasonStartDate: form.isSeasonal ? toIsoDateBoundary(form.seasonStartDate, false) : undefined,
        seasonEndDate: form.isSeasonal ? toIsoDateBoundary(form.seasonEndDate, true) : undefined,
        serviceWindows: form.isSeasonal
          ? form.serviceWindows.map((window) => ({
              label: window.label.trim() || "Window",
              daysOfWeek: window.daysOfWeek.slice().sort((a, b) => a - b),
              startTime: window.startTime,
              endTime: window.endTime,
              enabled: window.enabled
            }))
          : [],
        ingredients: form.ingredients.map((ingredient) => {
          const item = (inventoryQuery.data ?? []).find((stock) => stock.id === ingredient.inventoryItemId);
          return {
            inventoryItemId: ingredient.inventoryItemId,
            inventoryItemName: item?.name ?? "",
            quantity: Number(ingredient.quantity),
            unit: item?.unit ?? "",
            wastePercent: ingredient.wastePercent.length > 0 ? Number(ingredient.wastePercent) : undefined
          };
        })
      });
    },
    onSuccess: () => {
      toast.success("Menu item амжилттай үүслээ");
      setForm(EMPTY_FORM);
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ["menu", activeBranchId] });
      void queryClient.invalidateQueries({ queryKey: ["menu", activeBranchId, "management"] });
    },
    onError: (error) => {
      toast.error((error as Error).message || "Menu item үүсгэхэд алдаа гарлаа");
    }
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingId) throw new Error("Edit mode идэвхтэй биш байна");

      const price = Number(form.price);
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("Үнэ зөв оруулна уу");
      }

      return rmsApi.updateMenu({
        id: editingId,
        category: form.category.trim(),
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price,
        prepStation: form.prepStation.trim() || undefined,
        tags: normalizeTags(form.tags),
        available: form.available,
        isSeasonal: form.isSeasonal,
        seasonStartDate: form.isSeasonal ? toIsoDateBoundary(form.seasonStartDate, false) : undefined,
        seasonEndDate: form.isSeasonal ? toIsoDateBoundary(form.seasonEndDate, true) : undefined,
        serviceWindows: form.isSeasonal
          ? form.serviceWindows.map((window) => ({
              label: window.label.trim() || "Window",
              daysOfWeek: window.daysOfWeek.slice().sort((a, b) => a - b),
              startTime: window.startTime,
              endTime: window.endTime,
              enabled: window.enabled
            }))
          : [],
        ingredients: form.ingredients.map((ingredient) => {
          const item = (inventoryQuery.data ?? []).find((stock) => stock.id === ingredient.inventoryItemId);
          return {
            inventoryItemId: ingredient.inventoryItemId,
            inventoryItemName: item?.name ?? "",
            quantity: Number(ingredient.quantity),
            unit: item?.unit ?? "",
            wastePercent: ingredient.wastePercent.length > 0 ? Number(ingredient.wastePercent) : undefined
          };
        })
      });
    },
    onSuccess: () => {
      toast.success("Menu item амжилттай шинэчлэгдлээ");
      setForm(EMPTY_FORM);
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ["menu", activeBranchId] });
      void queryClient.invalidateQueries({ queryKey: ["menu", activeBranchId, "management"] });
    },
    onError: (error) => {
      toast.error((error as Error).message || "Menu item шинэчлэхэд алдаа гарлаа");
    }
  });

  const availabilityMutation = useMutation({
    mutationFn: (payload: { id: string; available: boolean }) =>
      rmsApi.updateMenuAvailability({ id: payload.id, available: payload.available }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["menu", activeBranchId] });
      void queryClient.invalidateQueries({ queryKey: ["menu", activeBranchId, "management"] });
    },
    onError: (error) => {
      toast.error((error as Error).message || "Availability шинэчлэхэд алдаа гарлаа");
    }
  });

  const menuItems = menuQuery.data ?? [];
  const inventoryItems = inventoryQuery.data ?? [];

  const inventoryMap = useMemo(() => new Map(inventoryItems.map((item) => [item.id, item])), [inventoryItems]);

  const categories = useMemo(() => {
    const set = new Set(menuItems.map((item) => item.category));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [menuItems]);

  const filteredItems = useMemo(
    () =>
      menuItems
        .filter((item) => {
          const byCategory = categoryFilter === "all" || item.category === categoryFilter;
          const bySearch =
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.sku.toLowerCase().includes(search.toLowerCase()) ||
            item.category.toLowerCase().includes(search.toLowerCase());
          return byCategory && bySearch;
        })
        .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
    [menuItems, categoryFilter, search]
  );

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (item: MenuItemRecord) => {
    setEditingId(item.id);
    setForm({
      category: item.category,
      sku: item.sku,
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      prepStation: item.prepStation ?? "main",
      tags: item.tags.join(", "),
      available: item.available,
      isSeasonal: Boolean(item.isSeasonal),
      seasonStartDate: toDateInput(item.seasonStartDate),
      seasonEndDate: toDateInput(item.seasonEndDate),
      ingredients: item.ingredients.map((ingredient) => ({
        inventoryItemId: ingredient.inventoryItemId,
        quantity: String(ingredient.quantity),
        wastePercent: ingredient.wastePercent !== undefined ? String(ingredient.wastePercent) : ""
      })),
      serviceWindows: (item.serviceWindows ?? []).map((window) => ({
        label: window.label ?? "",
        daysOfWeek: window.daysOfWeek ?? [],
        startTime: window.startTime,
        endTime: window.endTime,
        enabled: window.enabled ?? true
      }))
    });
  };

  const addIngredientLine = () => {
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { inventoryItemId: "", quantity: "", wastePercent: "" }]
    }));
  };

  const removeIngredientLine = (index: number) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index)
    }));
  };

  const updateIngredient = (index: number, patch: Partial<IngredientDraft>) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? { ...ingredient, ...patch } : ingredient
      )
    }));
  };

  const addServiceWindow = () => {
    setForm((prev) => ({
      ...prev,
      serviceWindows: [
        ...prev.serviceWindows,
        {
          label: "Lunch",
          daysOfWeek: [1, 2, 4],
          startTime: "12:00",
          endTime: "14:00",
          enabled: true
        }
      ]
    }));
  };

  const removeServiceWindow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      serviceWindows: prev.serviceWindows.filter((_, serviceIndex) => serviceIndex !== index)
    }));
  };

  const updateServiceWindow = (index: number, patch: Partial<ServiceWindowDraft>) => {
    setForm((prev) => ({
      ...prev,
      serviceWindows: prev.serviceWindows.map((window, serviceIndex) =>
        serviceIndex === index ? { ...window, ...patch } : window
      )
    }));
  };

  const toggleServiceWindowDay = (windowIndex: number, day: number) => {
    const target = form.serviceWindows[windowIndex];
    if (!target) return;
    const nextDays = target.daysOfWeek.includes(day)
      ? target.daysOfWeek.filter((item) => item !== day)
      : [...target.daysOfWeek, day];
    updateServiceWindow(windowIndex, { daysOfWeek: nextDays });
  };

  const onSubmit = async () => {
    if (!canWrite) {
      toast.error("Menu write permission байхгүй байна");
      return;
    }

    if (!form.category.trim() || !form.sku.trim() || !form.name.trim()) {
      toast.error("Category, SKU, Name талбарыг бөглөнө үү");
      return;
    }

    const invalidIngredient = form.ingredients.find((ingredient) => {
      const matchedStock = inventoryItems.find((item) => item.id === ingredient.inventoryItemId);
      const quantity = Number(ingredient.quantity);
      const wastePercent = ingredient.wastePercent.length > 0 ? Number(ingredient.wastePercent) : undefined;

      return (
        ingredient.inventoryItemId.length === 0 ||
        !matchedStock ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        (wastePercent !== undefined &&
          (!Number.isFinite(wastePercent) || wastePercent < 0 || wastePercent > 100))
      );
    });

    if (invalidIngredient) {
      toast.error("Ingredients мөр бүр дээр бараа болон тоо хэмжээг зөв оруулна уу");
      return;
    }

    if (form.isSeasonal) {
      if (form.serviceWindows.length === 0) {
        toast.error("Seasonal menu дээр дор хаяж нэг time window нэмнэ үү");
        return;
      }

      const invalidWindow = form.serviceWindows.find(
        (window) =>
          window.daysOfWeek.length === 0 ||
          window.startTime.length === 0 ||
          window.endTime.length === 0 ||
          window.startTime >= window.endTime
      );

      if (invalidWindow) {
        toast.error("Schedule window-ийн өдөр/цагийн тохиргоог зөв оруулна уу");
        return;
      }

      if (form.seasonStartDate.length > 0 && form.seasonEndDate.length > 0 && form.seasonStartDate > form.seasonEndDate) {
        toast.error("Season start date нь end date-ээс хойш байж болохгүй");
        return;
      }
    }

    if (editingId) {
      await updateMutation.mutateAsync();
      return;
    }

    await createMutation.mutateAsync();
  };

  if (!activeBranchId) {
    return (
      <div className="p-8">
        <div className="glass-card rounded-xl p-8 text-muted-foreground">Menu удирдахын тулд branch сонгоно уу.</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-primary" />
            Menu Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {menuItems.length} item • {menuItems.filter((item) => item.available).length} active
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5 xl:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">{editingId ? "Menu Item Edit" : "Menu Item Create"}</h2>
            {editingId ? (
              <button onClick={resetForm} className="text-xs text-muted-foreground hover:text-foreground">
                Cancel Edit
              </button>
            ) : null}
          </div>

          <div className="space-y-3">
            <Input
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Category"
            />
            <Input
              value={form.sku}
              onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
              placeholder="SKU"
            />
            <Input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Menu name"
            />
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Description"
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                placeholder="Price"
              />
              <Input
                value={form.prepStation}
                onChange={(event) => setForm((prev) => ({ ...prev, prepStation: event.target.value }))}
                placeholder="Prep station"
              />
            </div>
            <Input
              value={form.tags}
              onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
              placeholder="Tags: spicy, vegan"
            />

            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Active</p>
                  <p className="text-[11px] text-muted-foreground">Menu дээр харагдах эсэх</p>
                </div>
                <Switch
                  checked={form.available}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, available: checked }))}
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Seasonal Schedule</p>
                  <p className="text-[11px] text-muted-foreground">Өдөр, цагийн хуваарьт ажиллах menu</p>
                </div>
                <Switch
                  checked={form.isSeasonal}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      isSeasonal: checked,
                      serviceWindows: checked ? prev.serviceWindows : [],
                      seasonStartDate: checked ? prev.seasonStartDate : "",
                      seasonEndDate: checked ? prev.seasonEndDate : ""
                    }))
                  }
                />
              </div>

              {form.isSeasonal ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-1">Start date</p>
                      <Input
                        type="date"
                        value={form.seasonStartDate}
                        onChange={(event) => setForm((prev) => ({ ...prev, seasonStartDate: event.target.value }))}
                      />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-1">End date</p>
                      <Input
                        type="date"
                        value={form.seasonEndDate}
                        onChange={(event) => setForm((prev) => ({ ...prev, seasonEndDate: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-foreground">Service windows</p>
                    <button
                      type="button"
                      onClick={addServiceWindow}
                      className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border hover:bg-muted"
                    >
                      <Plus className="w-3 h-3" /> Add window
                    </button>
                  </div>

                  {form.serviceWindows.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">Жишээ: Lunch · Mon,Tue,Thu · 12:00-14:00</p>
                  ) : (
                    <div className="space-y-2">
                      {form.serviceWindows.map((window, index) => (
                        <div key={`${window.label}-${index}`} className="rounded-md border border-border bg-card px-2.5 py-2 space-y-2">
                          <div className="grid grid-cols-12 gap-2">
                            <Input
                              className="col-span-5"
                              value={window.label}
                              onChange={(event) => updateServiceWindow(index, { label: event.target.value })}
                              placeholder="Lunch"
                            />
                            <Input
                              className="col-span-3"
                              type="time"
                              value={window.startTime}
                              onChange={(event) => updateServiceWindow(index, { startTime: event.target.value })}
                            />
                            <Input
                              className="col-span-3"
                              type="time"
                              value={window.endTime}
                              onChange={(event) => updateServiceWindow(index, { endTime: event.target.value })}
                            />
                            <button
                              type="button"
                              onClick={() => removeServiceWindow(index)}
                              className="col-span-1 h-9 rounded-md border border-border text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-3 h-3 mx-auto" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {DAY_OPTIONS.map((day) => (
                              <Toggle
                                key={`${window.label}-${index}-${day.id}`}
                                pressed={window.daysOfWeek.includes(day.id)}
                                onPressedChange={() => toggleServiceWindowDay(index, day.id)}
                                variant="outline"
                                size="sm"
                              >
                                {day.label}
                              </Toggle>
                            ))}
                            <div className="ml-auto inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span>Enabled</span>
                              <Switch
                                size="sm"
                                checked={window.enabled}
                                onCheckedChange={(checked) => updateServiceWindow(index, { enabled: checked })}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Ingredients</h3>
              <button
                onClick={addIngredientLine}
                className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border hover:bg-muted"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            {form.ingredients.length === 0 ? (
              <p className="text-xs text-muted-foreground">Орц нэмээгүй бол хоосон үлдээж болно.</p>
            ) : (
              <div className="space-y-2">
                {form.ingredients.map((ingredient, index) => {
                  const selectedStock = inventoryItems.find((item) => item.id === ingredient.inventoryItemId);

                  return (
                    <div key={`${ingredient.inventoryItemId}-${index}`} className="grid grid-cols-12 gap-2 items-center">
                      <select
                        value={ingredient.inventoryItemId}
                        onChange={(event) => updateIngredient(index, { inventoryItemId: event.target.value })}
                        className="col-span-5 rounded-md border border-border bg-card px-2 py-2 text-xs text-foreground"
                      >
                        <option value="">Inventory</option>
                        {inventoryItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        className="col-span-3"
                        type="number"
                        min={0}
                        step="0.001"
                        value={ingredient.quantity}
                        onChange={(event) => updateIngredient(index, { quantity: event.target.value })}
                        placeholder="Qty"
                      />
                      <Input
                        className="col-span-3"
                        type="number"
                        min={0}
                        step="0.1"
                        value={ingredient.wastePercent}
                        onChange={(event) => updateIngredient(index, { wastePercent: event.target.value })}
                        placeholder="Waste%"
                      />
                      <button
                        onClick={() => removeIngredientLine(index)}
                        className="col-span-1 h-9 rounded-md border border-border text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3 mx-auto" />
                      </button>
                      <p className="col-span-12 text-[11px] text-muted-foreground">
                        Unit: {selectedStock?.unit ?? "-"} • On hand: {selectedStock?.onHand ?? 0}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              void onSubmit();
            }}
            disabled={createMutation.isPending || updateMutation.isPending || !canWrite}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editingId ? "Update Menu Item" : "Create Menu Item"}
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-5 xl:col-span-2 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search menu" className="pl-9" />
            </div>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All categories" : category}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const estimatedCost = buildFoodCost(item, inventoryMap);
              const margin = item.price > 0 ? ((item.price - estimatedCost) / item.price) * 100 : 0;

              return (
                <div key={item.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category} • {item.sku}</p>
                    </div>
                    <span className="text-sm font-bold text-primary">{toCurrency(item.price)}</span>
                  </div>

                  {item.description ? <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p> : null}

                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                    <span>Prep: {item.prepStation ?? "main"}</span>
                    <span>Ingredients: {item.ingredients.length}</span>
                    <span>Food cost: {toCurrency(estimatedCost)}</span>
                    <span>Margin: {margin.toFixed(1)}%</span>
                  </div>

                  {item.isSeasonal && item.serviceWindows.length > 0 ? (
                    <div className="rounded-md border border-border bg-muted/20 px-2.5 py-2 text-[11px] text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">Seasonal schedule</p>
                      {item.serviceWindows
                        .filter((window) => window.enabled !== false)
                        .map((window, index) => (
                          <p key={`${item.id}-window-${index}`}>{summarizeWindow(window)}</p>
                        ))}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => startEdit(item)}
                      disabled={!canWrite}
                      className="h-8 px-2.5 rounded-md border border-border text-xs text-foreground hover:bg-muted disabled:opacity-40 inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <div className="inline-flex items-center gap-2 rounded-md border border-border px-2.5 h-8">
                      <span className="text-xs text-muted-foreground">Active</span>
                      <Switch
                        size="sm"
                        checked={item.available}
                        disabled={!canWrite || availabilityMutation.isPending}
                        onCheckedChange={(checked) => availabilityMutation.mutate({ id: item.id, available: checked })}
                      />
                    </div>
                    <div className="ml-auto text-[11px] text-muted-foreground">
                      {item.tags.length > 0 ? item.tags.join(", ") : "No tags"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted/20 p-6 text-sm text-muted-foreground text-center">
              Илэрц олдсонгүй
            </div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
