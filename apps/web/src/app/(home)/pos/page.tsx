"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import EbarimtReceiptDialog from "@/components/ebarimt/EbarimtReceiptDialog";
import { useSession } from "@/hooks/use-session";
import { loadPrinterSettings } from "@/lib/printer-settings";
import { rmsApi } from "@/lib/rms-api";
import { playOrderPlacedSound, playPaymentSuccessSound } from "@/lib/sounds";
import type { EbarimtReceiptRecord, MenuItemRecord } from "@/types/rms";

function formatCurrency(amount: number) {
  return amount.toLocaleString() + "₮";
}

type PaymentMethod = "CASH" | "CARD" | "SOCIALPAY" | "QPAY" | "POCKET" | "BANK_TRANSFER";
type EbarimtCustomerType = "PERSONAL" | "ORGANIZATION";

interface CartItem {
  menuItem: MenuItemRecord;
  quantity: number;
}

const categoryEmoji: Record<string, string> = {
  Main: "🍽️",
  Coffee: "☕",
  Drink: "🥤",
  Dessert: "🍰",
  Appetizer: "🥗",
  default: "🍴"
};

const paymentMethods: Array<{ value: PaymentMethod; label: string }> = [
  { value: "CASH", label: "Бэлэн" },
  { value: "CARD", label: "Карт" },
  { value: "QPAY", label: "QPay" },
  { value: "SOCIALPAY", label: "SocialPay" },
  { value: "POCKET", label: "Pocket" },
  { value: "BANK_TRANSFER", label: "Шилжүүлэг" }
];

export default function POSPage() {
  const queryClient = useQueryClient();
  const { activeBranchId } = useSession();

  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNum, setTableNum] = useState(1);
  const [payNow, setPayNow] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [ebarimtCustomerType, setEbarimtCustomerType] = useState<EbarimtCustomerType>("PERSONAL");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationTin, setOrganizationTin] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [hotkeysEnabled, setHotkeysEnabled] = useState(true);
  const [ebarimtReceipt, setEbarimtReceipt] = useState<{
    orderNo: string;
    receipt: EbarimtReceiptRecord;
  } | null>(null);

  useEffect(() => {
    setHotkeysEnabled(loadPrinterSettings().enableHotkeys);
  }, []);

  useEffect(() => {
    if (!hotkeysEnabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F1") {
        event.preventDefault();
        setPaymentMethod("QPAY");
      }
      if (event.key === "F2") {
        event.preventDefault();
        setPaymentMethod("CARD");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [hotkeysEnabled]);

  const menuQuery = useQuery({
    queryKey: ["menu", activeBranchId],
    queryFn: () => rmsApi.listMenu(),
    enabled: Boolean(activeBranchId),
    refetchInterval: 15_000
  });

  const categories = useMemo(() => {
    const source = menuQuery.data ?? [];
    const set = new Set(source.map((item) => item.category));
    return ["all", ...Array.from(set)];
  }, [menuQuery.data]);

  const filteredItems = useMemo(() => {
    const source = menuQuery.data ?? [];
    const items = source.filter((item) => item.available);
    if (activeCategory === "all") return items;
    return items.filter((item) => item.category === activeCategory);
  }, [menuQuery.data, activeCategory]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),
    [cart]
  );

  const submitOrderMutation = useMutation({
    mutationFn: async () => {
      const order = await rmsApi.createOrder({
        tableId: null,
        note: `Table #${tableNum}`,
        sendToKitchen: true,
        items: cart.map((item) => ({
          menuItemId: item.menuItem.id,
          sku: item.menuItem.sku,
          itemName: item.menuItem.name,
          quantity: item.quantity,
          unitPrice: item.menuItem.price,
          discount: 0
        }))
      });

      if (payNow && ebarimtCustomerType === "ORGANIZATION") {
        if (!organizationName.trim() || !organizationTin.trim()) {
          throw new Error("Байгууллагын нэр болон РД/ТТД оруулна уу");
        }
      }

      let finalOrder = order;
      if (payNow) {
        finalOrder = await rmsApi.payOrder({
          orderId: order.id,
          amount: order.totalAmount,
          method: paymentMethod,
          ebarimt: {
            customerType: ebarimtCustomerType,
            customerName: ebarimtCustomerType === "ORGANIZATION" ? organizationName.trim() : undefined,
            customerTin: ebarimtCustomerType === "ORGANIZATION" ? organizationTin.trim() : undefined,
            customerPhone: customerPhone.trim() || undefined
          }
        });
      }

      return finalOrder;
    },
    onSuccess: (order) => {
      playOrderPlacedSound();
      if (payNow) {
        playPaymentSuccessSound();
      }

      if (payNow) {
        const latestEbarimt = [...order.payments]
          .reverse()
          .find((payment) => payment.ebarimt)?.ebarimt;

        if (latestEbarimt) {
          setEbarimtReceipt({
            orderNo: order.orderNo,
            receipt: latestEbarimt
          });
        }
      }

      toast.success(payNow ? `Захиалга + төлбөр амжилттай (№${tableNum})` : `Захиалга амжилттай (№${tableNum})`, {
        description: `Нийт: ${formatCurrency(total)}`
      });
      setCart([]);
      void queryClient.invalidateQueries({ queryKey: ["orders", activeBranchId] });
      void queryClient.invalidateQueries({ queryKey: ["kds", activeBranchId] });
      void queryClient.invalidateQueries({ queryKey: ["reports-summary", activeBranchId] });
    },
    onError: (error) => {
      toast.error((error as Error).message || "Захиалга үүсгэхэд алдаа гарлаа");
    }
  });

  function addToCart(item: MenuItemRecord) {
    setCart((prev) => {
      const existing = prev.find((entry) => entry.menuItem.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.menuItem.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((entry) => {
          if (entry.menuItem.id !== id) return entry;
          const nextQty = entry.quantity + delta;
          return nextQty > 0 ? { ...entry, quantity: nextQty } : entry;
        })
        .filter((entry) => entry.quantity > 0)
    );
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((entry) => entry.menuItem.id !== id));
  }

  if (!activeBranchId) {
    return (
      <div className="h-full overflow-y-auto p-8">
        <div className="glass-card rounded-xl p-8 flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <span>POS ашиглахын тулд эхлээд branch сонгоно уу.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-display font-bold text-foreground mb-6">Касс (POS)</h1>

          <div className="flex gap-2 mb-6 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === category
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                {category === "all" ? "Бүгд" : category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => addToCart(item)}
                  className="glass-card rounded-xl p-5 text-left hover:border-primary/30 transition-colors group"
                >
                  <span className="text-3xl">{categoryEmoji[item.category] ?? categoryEmoji.default}</span>
                  <h3 className="font-medium text-foreground mt-3 text-sm">{item.name}</h3>
                  <p className="text-primary font-display font-bold mt-1">{formatCurrency(item.price)}</p>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Нэмэх
                    </span>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="w-96 shrink-0 bg-card border-l border-border flex h-full min-h-0 flex-col"
      >
        <div className="shrink-0 p-6 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-foreground flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" /> Захиалга
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Ширээ:</span>
              <select
                value={tableNum}
                onChange={(event) => setTableNum(Number(event.target.value))}
                className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-sm border-0 outline-none"
              >
                {Array.from({ length: 20 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    №{i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="text-muted-foreground">
              Төлбөрийн төрөл
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-foreground"
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-end gap-2 text-muted-foreground">
              <input type="checkbox" checked={payNow} onChange={(event) => setPayNow(event.target.checked)} />
              Шууд төлөх
            </label>
          </div>
          {hotkeysEnabled ? (
            <p className="text-[11px] text-muted-foreground">Hotkeys: F1 = QPay, F2 = Card</p>
          ) : null}

          {payNow ? (
            <div className="rounded-lg border border-border bg-secondary/30 p-2.5 space-y-2 text-xs">
              <p className="text-muted-foreground">Е-Баримт авах төрөл</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEbarimtCustomerType("PERSONAL")}
                  className={`h-8 rounded-md border transition-colors ${
                    ebarimtCustomerType === "PERSONAL"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  Хувь хүн
                </button>
                <button
                  type="button"
                  onClick={() => setEbarimtCustomerType("ORGANIZATION")}
                  className={`h-8 rounded-md border transition-colors ${
                    ebarimtCustomerType === "ORGANIZATION"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  Байгууллага
                </button>
              </div>

              {ebarimtCustomerType === "ORGANIZATION" ? (
                <div className="grid grid-cols-1 gap-2">
                  <input
                    value={organizationName}
                    onChange={(event) => setOrganizationName(event.target.value)}
                    placeholder="Байгууллагын нэр"
                    className="h-8 rounded-md border border-border bg-background px-2 text-foreground outline-none"
                  />
                  <input
                    value={organizationTin}
                    onChange={(event) => setOrganizationTin(event.target.value)}
                    placeholder="РД / ТТД"
                    className="h-8 rounded-md border border-border bg-background px-2 text-foreground outline-none"
                  />
                </div>
              ) : null}

              <input
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="Утас (заавал биш)"
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-foreground outline-none"
              />
            </div>
          ) : null}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {cart.length === 0 ? (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-muted-foreground text-sm py-12">
                Захиалга хоосон байна
              </motion.p>
            ) : (
              cart.map((item) => (
                <motion.div
                  key={item.menuItem.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-secondary/50 rounded-lg p-3 flex items-center gap-3"
                >
                  <span className="text-xl">{categoryEmoji[item.menuItem.category] ?? categoryEmoji.default}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.menuItem.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.menuItem.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.menuItem.id, -1)}
                      className="w-7 h-7 rounded-md bg-muted hover:bg-border flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3 h-3 text-foreground" />
                    </button>
                    <span className="w-6 text-center text-sm font-mono font-bold text-foreground">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.menuItem.id, 1)}
                      className="w-7 h-7 rounded-md bg-muted hover:bg-border flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3 h-3 text-foreground" />
                    </button>
                    <button
                      onClick={() => removeItem(item.menuItem.id)}
                      className="w-7 h-7 rounded-md hover:bg-destructive/10 flex items-center justify-center transition-colors ml-1"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="shrink-0 p-6 border-t border-border space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Нийт дүн:</span>
            <motion.span key={total} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="text-xl font-display font-bold text-foreground">
              {formatCurrency(total)}
            </motion.span>
          </div>
          <Button
            onClick={() => submitOrderMutation.mutate()}
            disabled={cart.length === 0 || submitOrderMutation.isPending}
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            {submitOrderMutation.isPending ? "Илгээж байна..." : payNow ? "Захиалга + Төлбөр" : "Захиалга илгээх"}
          </Button>
        </div>
      </motion.div>

      <EbarimtReceiptDialog
        open={Boolean(ebarimtReceipt)}
        receipt={ebarimtReceipt?.receipt ?? null}
        orderNo={ebarimtReceipt?.orderNo}
        onClose={() => setEbarimtReceipt(null)}
      />
    </div>
  );
}
