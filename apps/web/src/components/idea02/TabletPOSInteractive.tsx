"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Icon from "@/components/idea02/AppIcon";
import EbarimtReceiptDialog from "@/components/ebarimt/EbarimtReceiptDialog";
import KDSConnectionStatusBanner from "@/components/idea02/KDSConnectionStatusBanner";
import PaymentPanel, {
  EbarimtCustomerInput,
  PaymentMethod as PanelPaymentMethod,
  ReceiptType
} from "@/components/idea02/PaymentPanel";
import { useSession } from "@/hooks/use-session";
import { useConnectionStatus } from "@/lib/idea02/kds-bridge";
import { rmsApi } from "@/lib/rms-api";
import { playOrderPlacedSound, playPaymentSuccessSound } from "@/lib/sounds";
import type { EbarimtReceiptRecord, MenuItemRecord } from "@/types/rms";

type OrderType = "dine-in" | "takeaway";
type FlowMode = "self" | "assisted";

interface TabletMenuItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  alt: string;
  tags: string[];
  available: boolean;
}

interface OrderItem {
  menuItem: TabletMenuItem;
  quantity: number;
  notes: string;
}

interface TableOption {
  id: string;
  label: string;
  status: "available" | "occupied" | "reserved";
  covers: number;
}

const DISCOUNT_CODES: Record<string, number> = {
  BISTRO10: 0.1,
  HAPPY20: 0.2,
  STAFF15: 0.15
};

const TABLE_STATUS_COLORS: Record<TableOption["status"], string> = {
  available: "bg-success/10 text-success border-success/30",
  occupied: "bg-destructive/10 text-destructive border-destructive/30",
  reserved: "bg-warning/10 text-warning border-warning/30"
};

const TABLES: TableOption[] = [
  { id: "t1", label: "Table 1", status: "available", covers: 4 },
  { id: "t2", label: "Table 2", status: "occupied", covers: 2 },
  { id: "t3", label: "Table 3", status: "available", covers: 6 },
  { id: "t4", label: "Table 4", status: "reserved", covers: 4 },
  { id: "t5", label: "Table 5", status: "available", covers: 2 },
  { id: "t6", label: "Table 6", status: "available", covers: 4 },
  { id: "t7", label: "Table 7", status: "available", covers: 8 },
  { id: "t8", label: "Bar 1", status: "available", covers: 1 }
];

const CATEGORY_FALLBACK_IMAGES: Record<string, string[]> = {
  appetizers: [
    "https://images.unsplash.com/photo-1499863005948-8bb96abc44d3",
    "https://images.unsplash.com/photo-1651399436026-3ca4088b3d6e"
  ],
  mains: [
    "https://images.unsplash.com/photo-1730863761922-a876066fbf7e",
    "https://images.unsplash.com/photo-1612870424350-5603f85b9487"
  ],
  desserts: [
    "https://images.unsplash.com/photo-1705234384751-84081009588e",
    "https://images.unsplash.com/photo-1488477181946-6428a0291777"
  ],
  beverages: [
    "https://images.unsplash.com/photo-1620400081393-69907fa4e510",
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd"
  ],
  default: [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de"
  ]
};

const PAYMENT_METHOD_MAP: Record<PanelPaymentMethod, "CASH" | "CARD" | "QPAY"> = {
  cash: "CASH",
  card: "CARD",
  qpay: "QPAY"
};

const CATEGORY_ICON_MAP: Record<string, string> = {
  appetizers: "SparklesIcon",
  starters: "SparklesIcon",
  mains: "FireIcon",
  grill: "FireIcon",
  desserts: "CakeIcon",
  beverages: "BeakerIcon",
  drinks: "BeakerIcon",
  salads: "LeafIcon"
};

function normalizeCategory(category: string): string {
  if (!category) return "Menu";
  return category
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function pickFallbackImage(category: string, index: number): string {
  const key = category.trim().toLowerCase();
  const bucket = CATEGORY_FALLBACK_IMAGES[key] ?? CATEGORY_FALLBACK_IMAGES.default;
  return bucket[index % bucket.length];
}

function mapMenuItem(item: MenuItemRecord, index: number): TabletMenuItem {
  return {
    id: item.id,
    sku: item.sku,
    name: item.name,
    description: item.description ?? "Chef recommendation",
    price: item.price,
    category: normalizeCategory(item.category),
    image: pickFallbackImage(item.category, index),
    alt: `${item.name} photo`,
    tags: item.tags,
    available: item.available
  };
}

function formatPrice(value: number): string {
  return `${value.toLocaleString()} ₮`;
}

function iconForCategory(category: string): string {
  const key = category.trim().toLowerCase();
  return CATEGORY_ICON_MAP[key] ?? "QueueListIcon";
}

const ASSISTED_ROLES = new Set(["SUPER_ADMIN", "ORG_ADMIN", "MANAGER", "CASHIER", "WAITER"]);
const DEFAULT_DEVICE_TABLE_ID = "t7";
const DEVICE_TABLE_STORAGE_PREFIX = "rms_tablet_device_table";

export default function TabletPOSInteractive() {
  const queryClient = useQueryClient();
  const { session, branches, activeBranchId, setActiveBranch } = useSession();
  const { isOnline, isReconnecting } = useConnectionStatus();

  const [language, setLanguage] = useState<"en" | "mn">("mn");
  const [flowMode, setFlowMode] = useState<FlowMode>("assisted");
  const [orderType, setOrderType] = useState<OrderType>("dine-in");
  const [selectedTableId, setSelectedTableId] = useState<string>(DEFAULT_DEVICE_TABLE_ID);
  const [deviceTableId, setDeviceTableId] = useState<string>(DEFAULT_DEVICE_TABLE_ID);
  const [activeCategory, setActiveCategory] = useState("all");
  const [dietaryFilter, setDietaryFilter] = useState<string[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [discountError, setDiscountError] = useState("");
  const [staffNotes, setStaffNotes] = useState("");
  const [collectPaymentNow, setCollectPaymentNow] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderForPayment, setOrderForPayment] = useState<{
    orderId: string;
    orderNo: string;
    amount: number;
  } | null>(null);
  const [ebarimtReceipt, setEbarimtReceipt] = useState<{
    orderNo: string;
    receipt: EbarimtReceiptRecord;
  } | null>(null);
  const effectiveBranchId = activeBranchId ?? session?.user.branchId ?? branches[0]?.id ?? null;

  const labels = {
    en: {
      title: "Tablet Order Station",
      flowSelf: "Customer Self-Order",
      flowAssisted: "Cashier / Waiter Assisted",
      dineIn: "Dine-In",
      takeaway: "Takeaway",
      selectTable: "Select Table",
      categories: "Categories",
      filters: "Dietary Filters",
      summary: "Order Summary",
      subtotal: "Subtotal",
      discount: "Discount",
      tax: "Tax (10%)",
      service: "Service (5%)",
      total: "Total",
      placeOrder: "Send to Kitchen",
      promoCode: "Promo Code",
      apply: "Apply",
      clear: "Clear",
      staffNotes: "Staff Notes",
      payNow: "Collect payment now",
      orderSent: "Order sent to kitchen",
      selectTableError: "Select a table for dine-in orders",
      noItems: "No items added",
      noMenu: "No menu found for this branch",
      branchRequired: "Branch must be selected for Tablet POS",
      orderFlow: "Order Flow",
      selectedTable: "Selected Table",
      tableDevice: "This tablet is placed at",
      customerTablet: "Customer tablet mode",
      setDeviceTable: "Set as device table",
      deviceTableSaved: "Device table updated",
      selfTableLocked: "Table is locked in customer mode"
    },
    mn: {
      title: "Tablet Захиалгын Станц",
      flowSelf: "Үйлчлүүлэгч өөрөө захиалах",
      flowAssisted: "Кассир / Зөөгч захиалах",
      dineIn: "Ресторанд",
      takeaway: "Авч явах",
      selectTable: "Ширээ сонгох",
      categories: "Ангиллууд",
      filters: "Шүүлтүүр",
      summary: "Захиалгын Дэлгэрэнгүй",
      subtotal: "Дүн",
      discount: "Хөнгөлөлт",
      tax: "НӨАТ (10%)",
      service: "Үйлчилгээ (5%)",
      total: "Нийт",
      placeOrder: "Гал тогоо руу илгээх",
      promoCode: "Промо код",
      apply: "Хэрэглэх",
      clear: "Цэвэрлэх",
      staffNotes: "Тэмдэглэл",
      payNow: "Одоо төлбөр авах",
      orderSent: "Захиалга гал тогоонд илгээгдлээ",
      selectTableError: "Ресторанд захиалга өгөхдөө ширээ сонгоно уу",
      noItems: "Сагс хоосон байна",
      noMenu: "Энэ салбарт menu бүртгэгдээгүй байна",
      branchRequired: "Tablet POS ашиглахын тулд branch сонгоно уу",
      orderFlow: "Захиалгын урсгал",
      selectedTable: "Сонгосон ширээ",
      tableDevice: "Энэ таблетын ширээ",
      customerTablet: "Үйлчлүүлэгчийн таблет горим",
      setDeviceTable: "Энэ таблетын ширээ болгох",
      deviceTableSaved: "Төхөөрөмжийн ширээ шинэчлэгдлээ",
      selfTableLocked: "Үйлчлүүлэгчийн горимд ширээ түгжээтэй"
    }
  };

  const t = labels[language];

  useEffect(() => {
    if (activeBranchId) return;
    if (!effectiveBranchId) return;
    setActiveBranch(effectiveBranchId);
  }, [activeBranchId, effectiveBranchId, setActiveBranch]);

  const canUseAssistedFlow = useMemo(() => {
    if (!session) return false;
    const roleSet = new Set(session.user.roles.map((role) => role.toUpperCase()));
    return Array.from(roleSet).some((role) => ASSISTED_ROLES.has(role));
  }, [session]);

  useEffect(() => {
    if (!effectiveBranchId || typeof window === "undefined") return;

    const storageKey = `${DEVICE_TABLE_STORAGE_PREFIX}:${effectiveBranchId}`;
    const stored = window.localStorage.getItem(storageKey);
    const hasStoredTable = stored !== null && TABLES.some((table) => table.id === stored);
    const nextTableId = hasStoredTable ? stored : DEFAULT_DEVICE_TABLE_ID;

    setDeviceTableId(nextTableId);
    setSelectedTableId(nextTableId);
  }, [effectiveBranchId]);

  useEffect(() => {
    if (!session) return;

    const roleSet = new Set(session.user.roles.map((role) => role.toUpperCase()));
    const isStaff = Array.from(roleSet).some((role) => ASSISTED_ROLES.has(role));
    setFlowMode(isStaff ? "assisted" : "self");
  }, [session]);

  useEffect(() => {
    if (flowMode === "self") {
      setOrderType("dine-in");
      setCollectPaymentNow(true);
      setSelectedTableId(deviceTableId || DEFAULT_DEVICE_TABLE_ID);
    }
  }, [flowMode, deviceTableId]);

  const menuQuery = useQuery({
    queryKey: ["menu", effectiveBranchId, "tablet-pos"],
    queryFn: () => rmsApi.listMenu(),
    enabled: Boolean(session && effectiveBranchId),
    refetchInterval: 20_000
  });

  const menuItems = useMemo(
    () => (menuQuery.data ?? []).map((item, index) => mapMenuItem(item, index)),
    [menuQuery.data]
  );

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();

    menuItems.forEach((item) => {
      map.set(item.category, (map.get(item.category) ?? 0) + 1);
    });

    return map;
  }, [menuItems]);

  const categories = useMemo(() => {
    const dynamicCategories = Array.from(categoryCounts.keys()).sort((a, b) => a.localeCompare(b));
    return [
      {
        id: "all",
        label: "All Items",
        icon: "QueueListIcon",
        count: menuItems.length
      },
      ...dynamicCategories.map((category) => ({
        id: category,
        label: category,
        icon: iconForCategory(category),
        count: categoryCounts.get(category) ?? 0
      }))
    ];
  }, [categoryCounts, menuItems.length]);

  const dietaryOptions = useMemo(() => {
    const tags = Array.from(new Set(menuItems.flatMap((item) => item.tags))).sort();
    return tags.map((tag) => ({
      id: tag,
      label: tag.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    }));
  }, [menuItems]);

  const filteredItems = useMemo(
    () =>
      menuItems.filter((item) => {
        const categoryMatch = activeCategory === "all" || item.category === activeCategory;
        const dietMatch =
          dietaryFilter.length === 0 || dietaryFilter.every((tag) => item.tags.includes(tag));
        return categoryMatch && dietMatch;
      }),
    [activeCategory, dietaryFilter, menuItems]
  );

  const selectedTable = useMemo(
    () => TABLES.find((table) => table.id === selectedTableId) ?? null,
    [selectedTableId]
  );
  const deviceTable = useMemo(
    () => TABLES.find((table) => table.id === deviceTableId) ?? null,
    [deviceTableId]
  );

  const totalItems = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.quantity, 0),
    [orderItems]
  );

  const subtotal = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),
    [orderItems]
  );

  const discountAmount = Math.round(subtotal * appliedDiscount);
  const taxableAmount = Math.max(subtotal - discountAmount, 0);
  const taxAmount = Math.round(taxableAmount * 0.1);
  const serviceAmount = Math.round(taxableAmount * 0.05);
  const estimatedTotal = taxableAmount + taxAmount + serviceAmount;
  const shouldCollectPaymentNow = flowMode === "self" ? true : collectPaymentNow;

  const addItem = (item: TabletMenuItem) => {
    if (!item.available) return;

    setOrderItems((prev) => {
      const existing = prev.find((entry) => entry.menuItem.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.menuItem.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      }

      return [...prev, { menuItem: item, quantity: 1, notes: "" }];
    });
  };

  const updateQty = (itemId: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((entry) =>
          entry.menuItem.id === itemId ? { ...entry, quantity: entry.quantity + delta } : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  };

  const updateItemNotes = (itemId: string, value: string) => {
    setOrderItems((prev) =>
      prev.map((entry) => (entry.menuItem.id === itemId ? { ...entry, notes: value } : entry))
    );
  };

  const getQty = (itemId: string) =>
    orderItems.find((entry) => entry.menuItem.id === itemId)?.quantity ?? 0;

  const toggleDietaryFilter = (id: string) => {
    setDietaryFilter((prev) => (prev.includes(id) ? prev.filter((tag) => tag !== id) : [...prev, id]));
  };

  const setTableAsDevice = () => {
    if (!effectiveBranchId || !selectedTable) return;
    const storageKey = `${DEVICE_TABLE_STORAGE_PREFIX}:${effectiveBranchId}`;
    setDeviceTableId(selectedTable.id);
    window.localStorage.setItem(storageKey, selectedTable.id);
    toast.success(t.deviceTableSaved);
  };

  const applyDiscount = () => {
    const rate = DISCOUNT_CODES[discountCode.trim().toUpperCase()];
    if (!rate) {
      setAppliedDiscount(0);
      setDiscountError(language === "mn" ? "Код буруу байна" : "Invalid code");
      return;
    }

    setDiscountError("");
    setAppliedDiscount(rate);
    toast.success(language === "mn" ? "Хөнгөлөлт амжилттай хэрэглэгдлээ" : "Discount code applied");
  };

  const resetOrderState = () => {
    setOrderItems([]);
    setStaffNotes("");
    setDiscountCode("");
    setAppliedDiscount(0);
    setDiscountError("");
    setOrderForPayment(null);
  };

  const markOrderSent = () => {
    setOrderSent(true);
    window.setTimeout(() => {
      setOrderSent(false);
      resetOrderState();
      setShowPaymentModal(false);
    }, 2800);
  };

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const noteParts = [
        "TABLET",
        `FLOW:${flowMode.toUpperCase()}`,
        `TYPE:${orderType.toUpperCase()}`
      ];

      if (selectedTable) {
        noteParts.push(`TABLE:${selectedTable.label}`);
      }

      if (staffNotes.trim()) {
        noteParts.push(`NOTE:${staffNotes.trim()}`);
      }

      return rmsApi.createOrder({
        tableId: null,
        guestName: flowMode === "self" ? "Tablet Self Order" : session?.user.fullName,
        note: noteParts.join(" | "),
        sendToKitchen: true,
        items: orderItems.map((entry) => {
          const lineSubtotal = entry.menuItem.price * entry.quantity;
          const lineDiscount = Math.round(lineSubtotal * appliedDiscount);
          return {
            menuItemId: entry.menuItem.id,
            sku: entry.menuItem.sku,
            itemName: entry.menuItem.name,
            quantity: entry.quantity,
            unitPrice: entry.menuItem.price,
            discount: lineDiscount,
            note: entry.notes || undefined
          };
        })
      });
    },
    onSuccess: (order) => {
      playOrderPlacedSound();
      void queryClient.invalidateQueries({ queryKey: ["orders", effectiveBranchId] });
      void queryClient.invalidateQueries({ queryKey: ["kds", effectiveBranchId] });
      void queryClient.invalidateQueries({ queryKey: ["reports-summary", effectiveBranchId] });

      if (shouldCollectPaymentNow) {
        setOrderForPayment({
          orderId: order.id,
          orderNo: order.orderNo,
          amount: order.totalAmount > 0 ? order.totalAmount : estimatedTotal
        });
        setShowPaymentModal(true);
      } else {
        toast.success(language === "mn" ? "Захиалга амжилттай илгээгдлээ" : "Order sent successfully");
        markOrderSent();
      }
    },
    onError: (error) => {
      toast.error((error as Error).message || (language === "mn" ? "Захиалга үүсгэхэд алдаа гарлаа" : "Failed to create order"));
    }
  });

  const payOrderMutation = useMutation({
    mutationFn: async ({
      method,
      ebarimt
    }: {
      method: PanelPaymentMethod;
      receipt: ReceiptType;
      ebarimt: EbarimtCustomerInput;
    }) => {
      if (!orderForPayment) {
        throw new Error("Order not ready for payment");
      }

      return rmsApi.payOrder({
        orderId: orderForPayment.orderId,
        amount: orderForPayment.amount,
        method: PAYMENT_METHOD_MAP[method],
        ebarimt: {
          customerType: ebarimt.customerType,
          customerName: ebarimt.customerName,
          customerTin: ebarimt.customerTin,
          customerPhone: ebarimt.customerPhone
        }
      });
    },
    onSuccess: (order) => {
      playPaymentSuccessSound();
      toast.success(language === "mn" ? "Төлбөр амжилттай" : "Payment successful");
      const latestEbarimt = [...order.payments]
        .reverse()
        .find((payment) => payment.ebarimt)?.ebarimt;
      if (latestEbarimt) {
        setEbarimtReceipt({ orderNo: order.orderNo, receipt: latestEbarimt });
      }
      setShowPaymentModal(false);
      markOrderSent();
    },
    onError: (error) => {
      toast.error((error as Error).message || (language === "mn" ? "Төлбөрийн алдаа" : "Payment failed"));
    }
  });

  const handlePlaceOrder = async () => {
    if (orderItems.length === 0) return;

    if (orderType === "dine-in" && !selectedTable) {
      toast.error(t.selectTableError);
      return;
    }

    await createOrderMutation.mutateAsync();
  };

  const handlePaymentSuccess = async (
    method: PanelPaymentMethod,
    receipt: ReceiptType,
    ebarimt: EbarimtCustomerInput
  ) => {
    await payOrderMutation.mutateAsync({ method, receipt, ebarimt });
  };

  if (!effectiveBranchId) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="rounded-2xl border border-border bg-card p-6 max-w-xl">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon name="ExclamationTriangleIcon" size={18} className="text-amber-500" variant="solid" />
            <span className="text-sm">{t.branchRequired}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 p-4 md:p-6">
      <div className="h-full min-h-0 rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
        <div className="shrink-0 border-b border-border px-4 py-3 md:px-5 md:py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-lg md:text-xl font-bold text-foreground">{t.title}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {flowMode === "self" ? t.customerTablet : t.flowAssisted}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage((prev) => (prev === "mn" ? "en" : "mn"))}
                className="text-xs bg-muted text-muted-foreground px-2.5 py-1.5 rounded-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              >
                {language === "mn" ? "EN" : "МН"}
              </button>
            </div>
          </div>
          <div className="mt-3">
            <KDSConnectionStatusBanner isOnline={isOnline} isReconnecting={isReconnecting} />
          </div>
        </div>

        <div className="grid flex-1 min-h-0 grid-cols-1 xl:grid-cols-[264px_minmax(0,1fr)_360px]">
          <aside className="min-h-0 overflow-y-auto border-r border-border bg-card p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t.orderFlow}</p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setFlowMode("self")}
                  className={`text-left rounded-xl border px-3 py-3 transition-all duration-200 ${
                    flowMode === "self"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon name="DeviceTabletIcon" size={16} />
                    <span className="text-sm font-semibold">{t.flowSelf}</span>
                  </div>
                </button>
                <button
                  onClick={() => setFlowMode("assisted")}
                  disabled={!canUseAssistedFlow}
                  className={`text-left rounded-xl border px-3 py-3 transition-all duration-200 ${
                    flowMode === "assisted"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  } ${!canUseAssistedFlow ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon name="UserGroupIcon" size={16} />
                    <span className="text-sm font-semibold">{t.flowAssisted}</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <div className="flex bg-muted rounded-sm p-0.5">
                {(["dine-in", "takeaway"] as const).map((type) => (
                  <button
                    key={type}
                    disabled={flowMode === "self" && type === "takeaway"}
                    onClick={() => setOrderType(type)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-sm transition-all duration-200 ${
                      orderType === type
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground disabled:opacity-40"
                    }`}
                  >
                    {type === "dine-in" ? t.dineIn : t.takeaway}
                  </button>
                ))}
              </div>
            </div>

            {orderType === "dine-in" && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t.selectTable}</p>
                {flowMode === "self" ? (
                  <div className="rounded-sm border border-primary/30 bg-primary/5 px-3 py-2.5">
                    <div className="text-xs font-semibold text-primary">
                      {t.tableDevice}: {deviceTable?.label ?? "-"}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{t.selfTableLocked}</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-1.5">
                      {TABLES.map((table) => (
                        <button
                          key={table.id}
                          onClick={() => setSelectedTableId(table.status === "available" ? table.id : selectedTableId)}
                          className={`text-xs py-1.5 px-2 rounded-sm border font-semibold transition-all duration-200 ${
                            selectedTableId === table.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : TABLE_STATUS_COLORS[table.status]
                          }`}
                        >
                          {table.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={setTableAsDevice}
                      disabled={!selectedTable}
                      className="mt-2 w-full rounded-sm border border-border bg-muted px-2.5 py-2 text-xs font-semibold text-foreground hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {t.setDeviceTable}
                    </button>
                  </>
                )}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t.categories}</p>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-sm font-medium transition-all duration-200 ${
                      activeCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon name={category.icon} size={15} />
                      <span>{category.label}</span>
                    </div>
                    <span
                      className={`text-xs rounded-full px-1.5 py-0.5 ${
                        activeCategory === category.id ? "bg-white/20" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {dietaryOptions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t.filters}</p>
                <div className="space-y-1">
                  {dietaryOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => toggleDietaryFilter(option.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-medium transition-all duration-200 ${
                        dietaryFilter.includes(option.id)
                          ? "bg-success/10 text-success border border-success/30"
                          : "text-muted-foreground hover:bg-muted border border-transparent"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          dietaryFilter.includes(option.id) ? "bg-success border-success" : "border-border"
                        }`}
                      >
                        {dietaryFilter.includes(option.id) && (
                          <Icon name="CheckIcon" size={10} className="text-white" />
                        )}
                      </div>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <main className="min-h-0 overflow-y-auto bg-background p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display font-bold text-lg text-foreground">
                  {categories.find((category) => category.id === activeCategory)?.label}
                </h2>
                <p className="text-xs text-muted-foreground">{filteredItems.length} items</p>
              </div>
              {orderType === "dine-in" && selectedTable && (
                <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-sm">
                  <Icon name="MapPinIcon" size={14} />
                  <span className="text-xs font-semibold">
                    {t.selectedTable}: {selectedTable.label}
                  </span>
                </div>
              )}
            </div>

            {menuQuery.isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-56 rounded-xl border border-border bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : menuQuery.isError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-semibold text-destructive">Menu load failed</p>
                <p className="text-xs text-muted-foreground mt-1">API connection эсвэл branch тохиргоог шалгана уу.</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">{t.noMenu}</div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
                {filteredItems.map((item) => {
                  const qty = getQty(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`bg-card border border-border rounded-sm overflow-hidden transition-all duration-200 ${
                        item.available ? "hover:border-primary/40 hover:-translate-y-0.5 cursor-pointer" : "opacity-50"
                      } ${qty > 0 ? "border-primary/50 ring-1 ring-primary/20" : ""}`}
                      onClick={() => addItem(item)}
                    >
                      <div className="relative h-32 overflow-hidden">
                        <img src={item.image} alt={item.alt} className="w-full h-full object-cover" />
                        {!item.available && (
                          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">Unavailable</span>
                          </div>
                        )}
                        {qty > 0 && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                            {qty}
                          </div>
                        )}
                      </div>

                      <div className="p-2.5">
                        <h3 className="font-semibold text-sm text-foreground leading-tight mb-1 line-clamp-1">{item.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">{item.description}</p>

                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-primary">{formatPrice(item.price)}</span>
                          {item.available &&
                            (qty > 0 ? (
                              <div className="flex items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
                                <button
                                  onClick={() => updateQty(item.id, -1)}
                                  className="w-6 h-6 bg-muted border border-border rounded-full flex items-center justify-center hover:border-primary transition-all duration-200"
                                >
                                  <Icon name="MinusIcon" size={10} />
                                </button>
                                <span className="font-bold text-xs w-4 text-center">{qty}</span>
                                <button
                                  onClick={() => addItem(item)}
                                  className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center transition-all duration-200"
                                >
                                  <Icon name="PlusIcon" size={10} />
                                </button>
                              </div>
                            ) : (
                              <button className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center transition-all duration-200 active:scale-95">
                                <Icon name="PlusIcon" size={12} />
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>

          <aside className="border-l border-border bg-card flex min-h-0 flex-col">
            <div className="shrink-0 px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-foreground">{t.summary}</h3>
                {orderType === "dine-in" && selectedTable && (
                  <p className="text-xs text-muted-foreground">
                    {selectedTable.label} · {selectedTable.covers} covers
                  </p>
                )}
                {orderType === "takeaway" && <p className="text-xs text-muted-foreground">{t.takeaway}</p>}
              </div>
              {orderItems.length > 0 && (
                <button
                  onClick={() => setOrderItems([])}
                  className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded-sm transition-all duration-200"
                >
                  {t.clear}
                </button>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
              {orderSent ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mb-3">
                    <Icon name="CheckCircleIcon" size={28} className="text-success" />
                  </div>
                  <p className="font-bold text-base text-foreground mb-1">{t.orderSent}</p>
                </div>
              ) : orderItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Icon name="QueueListIcon" size={36} className="text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">{t.noItems}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orderItems.map((entry) => (
                    <div key={entry.menuItem.id} className="bg-muted rounded-sm p-2.5">
                      <div className="flex items-center gap-2.5">
                        <img src={entry.menuItem.image} alt={entry.menuItem.alt} className="w-10 h-10 rounded-sm object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs text-foreground truncate">{entry.menuItem.name}</p>
                          <p className="text-xs text-primary font-semibold">
                            {formatPrice(entry.menuItem.price * entry.quantity)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQty(entry.menuItem.id, -1)}
                            className="w-5 h-5 bg-card border border-border rounded-full flex items-center justify-center hover:border-primary transition-all duration-200"
                          >
                            <Icon name="MinusIcon" size={9} />
                          </button>
                          <span className="font-bold text-xs w-4 text-center">{entry.quantity}</span>
                          <button
                            onClick={() => updateQty(entry.menuItem.id, 1)}
                            className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center transition-all duration-200"
                          >
                            <Icon name="PlusIcon" size={9} />
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={entry.notes}
                        onChange={(event) => updateItemNotes(entry.menuItem.id, event.target.value)}
                        placeholder={language === "mn" ? "Тухайн хоолны тэмдэглэл..." : "Item note..."}
                        className="mt-2 w-full bg-card border border-border rounded-sm px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!orderSent && (
              <div className="shrink-0 px-4 py-3 border-t border-border space-y-3">
                {orderItems.length > 0 && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                        {t.staffNotes}
                      </label>
                      <textarea
                        value={staffNotes}
                        onChange={(event) => setStaffNotes(event.target.value)}
                        placeholder={language === "mn" ? "Харшил, тусгай хүсэлт..." : "Allergy alerts, special requests..."}
                        className="w-full bg-muted border border-border rounded-sm px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                        rows={2}
                        disabled={flowMode === "self"}
                      />
                    </div>

                    {flowMode === "assisted" && (
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                          {t.promoCode}
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            value={discountCode}
                            onChange={(event) => {
                              setDiscountCode(event.target.value);
                              setDiscountError("");
                            }}
                            placeholder={language === "mn" ? "Код оруулах..." : "Enter code..."}
                            className="flex-1 bg-muted border border-border rounded-sm px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                          <button
                            onClick={applyDiscount}
                            className="bg-primary text-primary-foreground px-2.5 py-1.5 rounded-sm text-xs font-semibold transition-all duration-200"
                          >
                            {t.apply}
                          </button>
                        </div>
                        {discountError && <p className="text-xs text-destructive mt-1">{discountError}</p>}
                        {appliedDiscount > 0 && (
                          <p className="text-xs text-success mt-1">
                            {language === "mn" ? "Амжилттай: " : "Applied: "}
                            {(appliedDiscount * 100).toFixed(0)}%
                          </p>
                        )}
                      </div>
                    )}

                    {flowMode === "assisted" && (
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={collectPaymentNow}
                          onChange={(event) => setCollectPaymentNow(event.target.checked)}
                        />
                        {t.payNow}
                      </label>
                    )}
                  </>
                )}

                <div className="space-y-1.5 pt-2 border-t border-border">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {t.subtotal} ({totalItems})
                    </span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-xs text-success">
                      <span>
                        {t.discount} ({(appliedDiscount * 100).toFixed(0)}%)
                      </span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t.tax}</span>
                    <span>{formatPrice(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t.service}</span>
                    <span>{formatPrice(serviceAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-foreground pt-1.5 border-t border-border">
                    <span>{t.total}</span>
                    <span className="text-primary">{formatPrice(estimatedTotal)}</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    createOrderMutation.isPending ||
                    orderItems.length === 0 ||
                    (orderType === "dine-in" && !selectedTable)
                  }
                  className="w-full bg-primary text-primary-foreground py-3 rounded-sm font-bold text-sm transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createOrderMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Icon name="CheckIcon" size={15} />
                  )}
                  {t.placeOrder}
                </button>
                {orderType === "dine-in" && !selectedTable && (
                  <p className="text-xs text-center text-muted-foreground">{t.selectTableError}</p>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>

      {showPaymentModal && orderForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
          <div className="relative bg-card w-full max-w-md mx-4 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">{language === "mn" ? "Төлбөр" : "Payment"}</h3>
                <p className="text-xs text-muted-foreground">
                  {orderForPayment.orderNo} · {selectedTable ? selectedTable.label : t.takeaway}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-all duration-200"
              >
                <Icon name="XMarkIcon" size={16} />
              </button>
            </div>
            <div className="p-5">
              <div className="bg-muted rounded-xl p-3 mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{language === "mn" ? "Нийт дүн" : "Total Amount"}</span>
                <span className="font-bold text-lg text-primary">{formatPrice(orderForPayment.amount)}</span>
              </div>
              <PaymentPanel
                total={orderForPayment.amount}
                orderNumber={orderForPayment.orderNo}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPaymentModal(false)}
                lang={language}
                compact
              />
              {payOrderMutation.isPending && (
                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  {language === "mn" ? "Төлбөр баталгаажуулж байна..." : "Confirming payment..."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <EbarimtReceiptDialog
        open={Boolean(ebarimtReceipt)}
        receipt={ebarimtReceipt?.receipt ?? null}
        orderNo={ebarimtReceipt?.orderNo}
        onClose={() => setEbarimtReceipt(null)}
      />
    </div>
  );
}
