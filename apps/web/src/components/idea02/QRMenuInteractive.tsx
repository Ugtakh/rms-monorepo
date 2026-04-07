"use client";

import { useMemo, useRef, useState } from "react";
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

interface QRMenuItem {
  id: string;
  category: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  image: string;
  alt: string;
  tags: string[];
}

interface CartItem {
  menuItem: QRMenuItem;
  quantity: number;
  specialInstructions: string;
  modifiers: string[];
}

interface SpecialInstructionOption {
  label: string;
  value: string;
}

interface MenuCardProps {
  item: QRMenuItem;
  cartQty: number;
  onOpen: (item: QRMenuItem) => void;
  onUpdateQty: (itemId: string, delta: number) => void;
}

const SPECIAL_INSTRUCTION_OPTIONS: SpecialInstructionOption[] = [
  { label: "No onions", value: "no_onions" },
  { label: "Extra sauce", value: "extra_sauce" },
  { label: "Less spicy", value: "less_spicy" },
  { label: "No garlic", value: "no_garlic" },
  { label: "Gluten-free", value: "gluten_free" },
  { label: "No dairy", value: "no_dairy" }
];

const TAG_CONFIG: Record<string, { label: string; color: string }> = {
  vegetarian: { label: "Veg", color: "bg-emerald-100 text-emerald-700" },
  spicy: { label: "Spicy", color: "bg-red-100 text-red-700" }
};

const SERVICE_RATE = 0.1;

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

const PAYMENT_METHOD_MAP: Record<
  PanelPaymentMethod,
  "CASH" | "CARD" | "QPAY"
> = {
  cash: "CASH",
  card: "CARD",
  qpay: "QPAY"
};

function toTitleCaseCategory(category: string): string {
  if (!category) return "Menu";
  return category
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function pickFallbackImage(category: string, index: number): string {
  const normalized = category.trim().toLowerCase();
  const bucket =
    CATEGORY_FALLBACK_IMAGES[normalized] ?? CATEGORY_FALLBACK_IMAGES.default;
  return bucket[index % bucket.length];
}

function mapToQRMenuItem(item: MenuItemRecord, index: number): QRMenuItem {
  const category = toTitleCaseCategory(item.category);
  return {
    id: item.id,
    category,
    sku: item.sku,
    name: item.name,
    description: item.description ?? "Chef special recommendation.",
    price: item.price,
    available: item.available,
    image: pickFallbackImage(item.category, index),
    alt: `${item.name} menu photo`,
    tags: item.tags
  };
}

function formatPrice(amount: number): string {
  return `${amount.toLocaleString()} ₮`;
}

export default function QRMenuInteractive() {
  const queryClient = useQueryClient();
  const { session, activeBranchId } = useSession();
  const { isOnline, isReconnecting } = useConnectionStatus();

  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<QRMenuItem | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [instructionText, setInstructionText] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [itemQty, setItemQty] = useState(1);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [orderForPayment, setOrderForPayment] = useState<{
    id: string;
    orderNo: string;
    amount: number;
  } | null>(null);
  const [ebarimtReceipt, setEbarimtReceipt] = useState<{
    orderNo: string;
    receipt: EbarimtReceiptRecord;
  } | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const tableNumber = "Table 7";

  const menuQuery = useQuery({
    queryKey: ["menu", activeBranchId, "qr"],
    queryFn: () => rmsApi.listMenu(),
    enabled: Boolean(session && activeBranchId),
    refetchInterval: 20_000
  });

  const menuItems = useMemo(
    () => (menuQuery.data ?? []).map((item, index) => mapToQRMenuItem(item, index)),
    [menuQuery.data]
  );

  const categories = useMemo(() => {
    const categorySet = new Set(menuItems.map((item) => item.category));
    const sorted = Array.from(categorySet).sort((a, b) => a.localeCompare(b));
    return ["All", ...sorted];
  }, [menuItems]);

  const filteredItems =
    activeCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

  const groupedItems = useMemo(
    () =>
      categories.slice(1).reduce<Record<string, QRMenuItem[]>>((acc, category) => {
        acc[category] = menuItems.filter((item) => item.category === category);
        return acc;
      }, {}),
    [categories, menuItems]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0),
    [cart]
  );
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, cartItem) => sum + cartItem.menuItem.price * cartItem.quantity, 0),
    [cart]
  );
  const serviceCharge = Math.round(cartSubtotal * SERVICE_RATE);
  const totalWithService = cartSubtotal + serviceCharge;

  const getCartQty = (itemId: string) => {
    const cartItem = cart.find((item) => item.menuItem.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const openItemModal = (item: QRMenuItem) => {
    if (!item.available) return;
    setSelectedItem(item);
    setItemQty(1);
    setInstructionText("");
    setSelectedOptions([]);
  };

  const toggleOption = (value: string) => {
    setSelectedOptions((prev) =>
      prev.includes(value) ? prev.filter((option) => option !== value) : [...prev, value]
    );
  };

  const addToCart = () => {
    if (!selectedItem) return;

    const instructions = [
      ...selectedOptions
        .map((option) => SPECIAL_INSTRUCTION_OPTIONS.find((item) => item.value === option)?.label ?? "")
        .filter(Boolean),
      instructionText.trim()
    ]
      .filter(Boolean)
      .join(", ");

    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.menuItem.id === selectedItem.id);
      if (!existing) {
        return [
          ...prev,
          {
            menuItem: selectedItem,
            quantity: itemQty,
            specialInstructions: instructions,
            modifiers: selectedOptions
          }
        ];
      }

      return prev.map((cartItem) =>
        cartItem.menuItem.id === selectedItem.id
          ? {
              ...cartItem,
              quantity: cartItem.quantity + itemQty,
              specialInstructions: instructions.length > 0 ? instructions : cartItem.specialInstructions,
              modifiers: selectedOptions.length > 0 ? selectedOptions : cartItem.modifiers
            }
          : cartItem
      );
    });

    setSelectedItem(null);
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((cartItem) =>
          cartItem.menuItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity + delta }
            : cartItem
        )
        .filter((cartItem) => cartItem.quantity > 0)
    );
  };

  const createOrderMutation = useMutation({
    mutationFn: async () =>
      rmsApi.createOrder({
        tableId: null,
        note: `QR:${tableNumber}`,
        sendToKitchen: true,
        items: cart.map((cartItem) => ({
          menuItemId: cartItem.menuItem.id,
          sku: cartItem.menuItem.sku,
          itemName: cartItem.menuItem.name,
          quantity: cartItem.quantity,
          unitPrice: cartItem.menuItem.price,
          discount: 0,
          note: cartItem.specialInstructions || undefined
        }))
      }),
    onSuccess: (order) => {
      playOrderPlacedSound();
      setOrderForPayment({
        id: order.id,
        orderNo: order.orderNo,
        amount: order.totalAmount > 0 ? order.totalAmount : totalWithService
      });
      setShowPayment(true);

      void queryClient.invalidateQueries({ queryKey: ["orders", activeBranchId] });
      void queryClient.invalidateQueries({ queryKey: ["kds", activeBranchId] });
      toast.success(`Order created (${order.orderNo})`);
    },
    onError: (error) => {
      toast.error((error as Error).message || "Order create failed");
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
        orderId: orderForPayment.id,
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
      setShowPayment(false);
      setOrderPlaced(true);

      const latestEbarimt = [...order.payments]
        .reverse()
        .find((payment) => payment.ebarimt)?.ebarimt;
      if (latestEbarimt) {
        setEbarimtReceipt({ orderNo: order.orderNo, receipt: latestEbarimt });
      }

      void queryClient.invalidateQueries({ queryKey: ["orders", activeBranchId] });
      void queryClient.invalidateQueries({ queryKey: ["kds", activeBranchId] });
      toast.success("Payment successful");

      window.setTimeout(() => {
        setCart([]);
        setShowCart(false);
        setOrderPlaced(false);
        setOrderForPayment(null);
      }, 2800);
    },
    onError: (error) => {
      toast.error((error as Error).message || "Payment failed");
    }
  });

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    await createOrderMutation.mutateAsync();
  };

  const handlePaymentSuccess = async (
    method: PanelPaymentMethod,
    receipt: ReceiptType,
    ebarimt: EbarimtCustomerInput
  ) => {
    await payOrderMutation.mutateAsync({ method, receipt, ebarimt });
  };

  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    if (category !== "All" && categoryRefs.current[category]) {
      categoryRefs.current[category]?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  if (!activeBranchId) {
    return (
      <div className="h-full min-h-0 overflow-y-auto p-6">
        <div className="max-w-md mx-auto rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Icon name="ExclamationTriangleIcon" size={18} className="text-amber-500" variant="solid" />
            <span className="text-sm">QR menu ашиглахын тулд branch сонгоно уу.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 bg-background flex flex-col max-w-md mx-auto relative border-x border-border/50 overflow-hidden">
      <header className="sticky top-0 z-20 bg-card border-b border-border shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-primary flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M3 14L7 9L10.5 12L14 7L17 10"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="17" cy="10" r="1.5" fill="#F59E0B" />
                </svg>
              </div>
              <span className="font-display font-bold text-base text-foreground">BistroIQ</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Icon name="MapPinIcon" size={12} className="text-primary" />
              <span className="text-xs text-primary font-semibold">{tableNumber}</span>
              <span className="text-muted-foreground text-xs">· Scan & Order</span>
            </div>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-sm text-sm font-semibold transition-all duration-200 active:scale-95"
          >
            <Icon name="ShoppingCartIcon" size={16} />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-accent-foreground rounded-full text-xs font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        <div className="px-4 pb-2">
          <KDSConnectionStatusBanner isOnline={isOnline} isReconnecting={isReconnecting} />
        </div>

        <div className="flex gap-1 px-4 pb-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => scrollToCategory(category)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                activeCategory === category
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto pb-28">
        {menuQuery.isLoading ? (
          <div className="px-4 pt-4 grid grid-cols-1 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-28 rounded-sm border border-border bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : menuQuery.isError ? (
          <div className="px-4 pt-8">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-destructive font-semibold">Menu load failed</p>
              <p className="text-xs text-muted-foreground mt-1">API connection эсвэл branch тохиргоо шалгана уу.</p>
            </div>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="px-4 pt-8">
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Энэ branch дээр menu бүртгэгдээгүй байна.
            </div>
          </div>
        ) : activeCategory === "All" ? (
          Object.entries(groupedItems).map(([category, items]) => (
            <div
              key={category}
              ref={(element) => {
                categoryRefs.current[category] = element;
              }}
            >
              <div className="px-4 pt-6 pb-2">
                <h2 className="font-display font-bold text-lg text-foreground">{category}</h2>
                <div className="w-8 h-0.5 bg-primary mt-1 rounded-full" />
              </div>
              <div className="px-4 grid grid-cols-1 gap-3">
                {items.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    cartQty={getCartQty(item.id)}
                    onOpen={openItemModal}
                    onUpdateQty={updateCartQty}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 pt-4 grid grid-cols-1 gap-3">
            {filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                cartQty={getCartQty(item.id)}
                onOpen={openItemModal}
                onUpdateQty={updateCartQty}
              />
            ))}
          </div>
        )}
      </main>

      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-sm">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-primary text-primary-foreground px-5 py-3.5 rounded-sm shadow-lg flex items-center justify-between transition-all duration-200 active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
              <span className="font-semibold text-sm">View Order</span>
            </div>
            <span className="font-bold text-sm">{formatPrice(cartSubtotal)}</span>
          </button>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
          <div className="relative bg-card w-full max-w-md rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="relative h-48 overflow-hidden rounded-t-2xl">
              <img src={selectedItem.image} alt={selectedItem.alt} className="w-full h-full object-cover" />
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-card/90 rounded-full flex items-center justify-center shadow-sm"
              >
                <Icon name="XMarkIcon" size={16} />
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-display font-bold text-xl text-foreground">{selectedItem.name}</h3>
                <span className="font-bold text-lg text-primary whitespace-nowrap">
                  {formatPrice(selectedItem.price)}
                </span>
              </div>
              <p className="text-muted-foreground text-sm mb-3 leading-relaxed">{selectedItem.description}</p>

              {selectedItem.tags.length > 0 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {selectedItem.tags.map((tag) => {
                    const tagView = TAG_CONFIG[tag];
                    if (!tagView) return null;

                    return (
                      <span key={tag} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tagView.color}`}>
                        {tagView.label}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="mb-4">
                <p className="font-semibold text-sm text-foreground mb-2">Special Requests</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {SPECIAL_INSTRUCTION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => toggleOption(option.value)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                        selectedOptions.includes(option.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border hover:border-primary"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={instructionText}
                  onChange={(event) => setInstructionText(event.target.value)}
                  placeholder="Allergy info, cooking preference..."
                  className="w-full bg-muted border border-border rounded-sm px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-muted rounded-sm px-3 py-2">
                  <button
                    onClick={() => setItemQty((qty) => Math.max(1, qty - 1))}
                    className="text-foreground hover:text-primary transition-all duration-200"
                  >
                    <Icon name="MinusIcon" size={16} />
                  </button>
                  <span className="font-bold text-base w-6 text-center">{itemQty}</span>
                  <button
                    onClick={() => setItemQty((qty) => qty + 1)}
                    className="text-foreground hover:text-primary transition-all duration-200"
                  >
                    <Icon name="PlusIcon" size={16} />
                  </button>
                </div>
                <button
                  onClick={addToCart}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-sm font-semibold text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Icon name="PlusCircleIcon" size={16} />
                  Add to Order · {formatPrice(selectedItem.price * itemQty)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => {
              setShowCart(false);
              setShowPayment(false);
            }}
          />
          <div className="relative bg-card w-full max-w-md rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                {showPayment && (
                  <button
                    onClick={() => setShowPayment(false)}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-1"
                  >
                    <Icon name="ArrowLeftIcon" size={14} />
                  </button>
                )}
                <h3 className="font-display font-bold text-lg text-foreground">
                  {showPayment ? "Payment" : "Your Order"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{tableNumber}</span>
                <button
                  onClick={() => {
                    setShowCart(false);
                    setShowPayment(false);
                  }}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <Icon name="XMarkIcon" size={16} />
                </button>
              </div>
            </div>

            {orderPlaced ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                  <Icon name="CheckCircleIcon" size={32} className="text-success" />
                </div>
                <h4 className="font-display font-bold text-xl text-foreground mb-2">Order Sent!</h4>
                <p className="text-muted-foreground text-sm">
                  Захиалга гал тогоо руу илгээгдлээ. Ойролцоогоор 15-20 минут.
                </p>
              </div>
            ) : showPayment && orderForPayment ? (
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="bg-muted rounded-xl p-3 mb-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total ({cartCount} items)</span>
                  <span className="font-bold text-lg text-primary">{formatPrice(orderForPayment.amount)}</span>
                </div>
                <PaymentPanel
                  total={orderForPayment.amount}
                  orderNumber={orderForPayment.orderNo}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setShowPayment(false)}
                  lang="mn"
                  compact
                />
                {payOrderMutation.isPending && (
                  <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                    Төлбөр API баталгаажуулж байна...
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
                  {cart.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Icon name="ShoppingCartIcon" size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Таны сагс хоосон байна</p>
                    </div>
                  ) : (
                    cart.map((cartItem) => (
                      <div key={cartItem.menuItem.id} className="flex items-center gap-3 bg-muted rounded-sm p-3">
                        <img
                          src={cartItem.menuItem.image}
                          alt={cartItem.menuItem.alt}
                          className="w-14 h-14 rounded-sm object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{cartItem.menuItem.name}</p>
                          {cartItem.specialInstructions && (
                            <p className="text-xs text-muted-foreground truncate">{cartItem.specialInstructions}</p>
                          )}
                          <p className="text-xs text-primary font-semibold mt-0.5">
                            {formatPrice(cartItem.menuItem.price * cartItem.quantity)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQty(cartItem.menuItem.id, -1)}
                            className="w-7 h-7 bg-card border border-border rounded-full flex items-center justify-center text-foreground hover:border-primary transition-all duration-200"
                          >
                            <Icon name="MinusIcon" size={12} />
                          </button>
                          <span className="font-bold text-sm w-5 text-center">{cartItem.quantity}</span>
                          <button
                            onClick={() => updateCartQty(cartItem.menuItem.id, 1)}
                            className="w-7 h-7 bg-card border border-border rounded-full flex items-center justify-center text-foreground hover:border-primary transition-all duration-200"
                          >
                            <Icon name="PlusIcon" size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="px-5 py-4 border-t border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Subtotal ({cartCount} items)</span>
                      <span className="font-bold text-foreground">{formatPrice(cartSubtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-muted-foreground">Service charge (10%)</span>
                      <span className="text-sm text-muted-foreground">{formatPrice(serviceCharge)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-4 pt-3 border-t border-border">
                      <span className="font-bold text-foreground">Total</span>
                      <span className="font-bold text-lg text-primary">{formatPrice(totalWithService)}</span>
                    </div>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={createOrderMutation.isPending}
                      className="w-full bg-primary text-primary-foreground py-3.5 rounded-sm font-bold text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {createOrderMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Icon name="CreditCardIcon" size={16} />
                      )}
                      {createOrderMutation.isPending ? "Processing..." : "Proceed to Payment"}
                    </button>
                  </div>
                )}
              </>
            )}
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

function MenuCard({ item, cartQty, onOpen, onUpdateQty }: MenuCardProps) {
  return (
    <div
      className={`bg-card border border-border rounded-sm overflow-hidden flex gap-3 transition-all duration-200 ${
        !item.available ? "opacity-50" : "cursor-pointer hover:border-primary/40 hover:-translate-y-0.5"
      }`}
      onClick={() => onOpen(item)}
    >
      <div className="relative w-28 h-28 shrink-0">
        <img src={item.image} alt={item.alt} className="w-full h-full object-cover" />
        {!item.available && (
          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
            <span className="text-white text-xs font-bold">Unavailable</span>
          </div>
        )}
      </div>

      <div className="flex-1 py-3 pr-3 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-semibold text-sm text-foreground leading-tight">{item.name}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2 mt-1">{item.description}</p>
          {item.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mb-2">
              {item.tags.map((tag) => {
                const tagView = TAG_CONFIG[tag];
                if (!tagView) return null;

                return (
                  <span key={tag} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tagView.color}`}>
                    {tagView.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-primary">{formatPrice(item.price)}</span>
          {item.available &&
            (cartQty > 0 ? (
              <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                <button
                  onClick={() => onUpdateQty(item.id, -1)}
                  className="w-6 h-6 bg-muted border border-border rounded-full flex items-center justify-center hover:border-primary transition-all duration-200"
                >
                  <Icon name="MinusIcon" size={10} />
                </button>
                <span className="font-bold text-sm w-4 text-center">{cartQty}</span>
                <button
                  onClick={() => onUpdateQty(item.id, 1)}
                  className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center transition-all duration-200"
                >
                  <Icon name="PlusIcon" size={10} />
                </button>
              </div>
            ) : (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen(item);
                }}
                className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center transition-all duration-200 active:scale-95"
              >
                <Icon name="PlusIcon" size={14} />
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
