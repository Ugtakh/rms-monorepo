"use client";

import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/idea02/AppIcon";

import {
  useConnectionStatus,
  insertOrder,
} from "@/lib/idea02/kiosk-bridge";
import PaymentPanel, {
  PaymentMethod as PanelPaymentMethod,
  ReceiptType,
} from "@/components/idea02/PaymentPanel";
import ReceiptTemplate, {
  ReceiptData,
} from "@/components/idea02/ReceiptTemplate";

// ── Types ──────────────────────────────────────────────────────────────────────

type ViewMode =
  | "welcome"
  | "menu"
  | "item-detail"
  | "cart"
  | "payment"
  | "confirmation";
type OrderType = "dine-in" | "takeaway";
type InterfaceMode = "kiosk" | "tablet" | "qr";
type Language = "en" | "mn";
type PaymentMethod = "card" | "qpay" | "cash";

interface MenuCategory {
  id: string;
  name: { en: string; mn: string };
  icon: string;
  color: string;
  count: number;
}

interface MenuItem {
  id: string;
  categoryId: string;
  name: { en: string; mn: string };
  description: { en: string; mn: string };
  price: number;
  image: string;
  alt: string;
  popular?: boolean;
  spicy?: boolean;
  vegetarian?: boolean;
  sizes?: { label: string; price: number }[];
  addons?: { id: string; label: string; price: number }[];
}

interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
  size?: string;
  addons: string[];
  instructions: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORIES: MenuCategory[] = [
  {
    id: "starters",
    name: { en: "Starters", mn: "Эхлэл хоол" },
    icon: "SparklesIcon",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    count: 8,
  },
  {
    id: "mains",
    name: { en: "Main Dishes", mn: "Үндсэн хоол" },
    icon: "FireIcon",
    color: "bg-red-50 text-red-700 border-red-200",
    count: 14,
  },
  {
    id: "grills",
    name: { en: "Grills", mn: "Шарсан мах" },
    icon: "CpuChipIcon",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    count: 6,
  },
  {
    id: "salads",
    name: { en: "Salads", mn: "Салат" },
    icon: "LeafIcon",
    color: "bg-green-50 text-green-700 border-green-200",
    count: 7,
  },
  {
    id: "pasta",
    name: { en: "Pasta & Rice", mn: "Гурил & Будаа" },
    icon: "CircleStackIcon",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    count: 9,
  },
  {
    id: "desserts",
    name: { en: "Desserts", mn: "Амттан" },
    icon: "CakeIcon",
    color: "bg-pink-50 text-pink-700 border-pink-200",
    count: 5,
  },
  {
    id: "drinks",
    name: { en: "Drinks", mn: "Ундаа" },
    icon: "BeakerIcon",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    count: 12,
  },
  {
    id: "specials",
    name: { en: "Chef's Specials", mn: "Тусгай цэс" },
    icon: "StarIcon",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    count: 4,
  },
];

const MENU_ITEMS: MenuItem[] = [
  {
    id: "m1",
    categoryId: "starters",
    name: { en: "Crispy Calamari", mn: "Хуурсан далайн хоол" },
    description: {
      en: "Golden fried squid rings with marinara sauce and lemon wedges",
      mn: "Алтан шарсан далайн хоол маринара соустай",
    },
    price: 12500,
    image: "https://images.unsplash.com/photo-1727198826280-a5cbb9ff2467",
    alt: "Crispy golden calamari rings served with marinara dipping sauce and lemon wedges on a white plate",
    popular: true,
    addons: [
      { id: "a1", label: "Extra sauce", price: 500 },
      { id: "a2", label: "Garlic bread", price: 1500 },
    ],
  },
  {
    id: "m2",
    categoryId: "starters",
    name: { en: "Bruschetta", mn: "Брускетта" },
    description: {
      en: "Toasted bread with fresh tomatoes, basil, and extra virgin olive oil",
      mn: "Шинэ улаан лоолиор чимэглэсэн шарсан талх",
    },
    price: 9800,
    image:
      "https://img.rocket.new/generatedImages/rocket_gen_img_14fe786d4-1772650699880.png",
    alt: "Toasted bruschetta topped with diced fresh tomatoes, basil leaves, and drizzled with olive oil",
    vegetarian: true,
  },
  {
    id: "m3",
    categoryId: "mains",
    name: { en: "Ribeye Steak", mn: "Рибай стейк" },
    description: {
      en: "300g premium ribeye with roasted vegetables and peppercorn sauce",
      mn: "300г рибай стейк шарсан хүнсний ногоотой",
    },
    price: 58000,
    image: "https://images.unsplash.com/photo-1690983322025-aab4f95a0269",
    alt: "Thick ribeye steak cooked to medium-rare with roasted vegetables and peppercorn sauce on a wooden board",
    popular: true,
    sizes: [
      { label: "200g", price: 45000 },
      { label: "300g", price: 58000 },
      { label: "400g", price: 72000 },
    ],
    addons: [
      { id: "a3", label: "Extra sauce", price: 800 },
      { id: "a4", label: "Side salad", price: 3500 },
      { id: "a5", label: "Fries", price: 4000 },
    ],
  },
  {
    id: "m4",
    categoryId: "mains",
    name: { en: "Grilled Salmon", mn: "Шарсан загас" },
    description: {
      en: "Atlantic salmon fillet with lemon butter sauce and seasonal vegetables",
      mn: "Атлантын тэнгисийн загас лимон цөцгийн тосны соустай",
    },
    price: 42000,
    image:
      "https://img.rocket.new/generatedImages/rocket_gen_img_115ad46e4-1772863477725.png",
    alt: "Grilled salmon fillet with golden crust served with lemon butter sauce and colorful seasonal vegetables",
    addons: [
      { id: "a6", label: "Extra lemon", price: 300 },
      { id: "a7", label: "Mashed potato", price: 3000 },
    ],
  },
  {
    id: "m5",
    categoryId: "grills",
    name: { en: "BBQ Chicken", mn: "BBQ тахиа" },
    description: {
      en: "Half chicken marinated in house BBQ sauce, slow-grilled to perfection",
      mn: "Гэрийн BBQ соусанд маринадласан тахиа",
    },
    price: 28000,
    image:
      "https://img.rocket.new/generatedImages/rocket_gen_img_1616c34d3-1766301465300.png",
    alt: "Half BBQ chicken with caramelized glaze served with coleslaw and corn on the cob",
    popular: true,
    spicy: true,
    addons: [
      { id: "a8", label: "Extra BBQ sauce", price: 500 },
      { id: "a9", label: "Corn on cob", price: 2000 },
    ],
  },
  {
    id: "m6",
    categoryId: "salads",
    name: { en: "Caesar Salad", mn: "Цезарь салат" },
    description: {
      en: "Romaine lettuce, parmesan, croutons, and classic Caesar dressing",
      mn: "Ромайн гашуун, пармезан, крутон, Цезарь соус",
    },
    price: 16500,
    image: "https://images.unsplash.com/photo-1598148147935-05b3518efe32",
    alt: "Fresh Caesar salad with crisp romaine lettuce, shaved parmesan, golden croutons, and creamy dressing",
    vegetarian: true,
    addons: [
      { id: "a10", label: "Grilled chicken", price: 5000 },
      { id: "a11", label: "Anchovies", price: 1500 },
    ],
  },
  {
    id: "m7",
    categoryId: "pasta",
    name: { en: "Spaghetti Carbonara", mn: "Карбонара" },
    description: {
      en: "Classic Roman pasta with pancetta, egg yolk, pecorino, and black pepper",
      mn: "Уламжлалт Ромын гурил панчетта, өндөгний шар",
    },
    price: 22000,
    image: "https://images.unsplash.com/photo-1663721605989-3bdd2c994190",
    alt: "Creamy spaghetti carbonara with crispy pancetta, fresh egg yolk sauce, and grated pecorino cheese",
    popular: true,
  },
  {
    id: "m8",
    categoryId: "desserts",
    name: { en: "Chocolate Lava Cake", mn: "Шоколадны бялуу" },
    description: {
      en: "Warm chocolate cake with molten center, served with vanilla ice cream",
      mn: "Дотор нь хайлсан шоколадтай дулаан бялуу",
    },
    price: 14000,
    image:
      "https://img.rocket.new/generatedImages/rocket_gen_img_12fe6d045-1772734044615.png",
    alt: "Warm chocolate lava cake with molten chocolate center flowing out, served with a scoop of vanilla ice cream",
    popular: true,
  },
  {
    id: "m9",
    categoryId: "drinks",
    name: { en: "Fresh Lemonade", mn: "Шинэ лимонад" },
    description: {
      en: "Freshly squeezed lemonade with mint and a hint of ginger",
      mn: "Шинэхэн шахсан лимон, цэцэрлэгийн ногоотой",
    },
    price: 7500,
    image: "https://images.unsplash.com/photo-1620400081393-69907fa4e510",
    alt: "Tall glass of fresh lemonade with mint leaves, lemon slices, and ice cubes",
    vegetarian: true,
    sizes: [
      { label: "Regular", price: 7500 },
      { label: "Large", price: 9500 },
    ],
  },
  {
    id: "m10",
    categoryId: "specials",
    name: { en: "Chef's Lamb Shank", mn: "Тусгай хонины гуя" },
    description: {
      en: "Slow-braised lamb shank with rosemary jus and creamy polenta",
      mn: "Удаан шарсан хонины гуя розмарин соустай",
    },
    price: 65000,
    image: "https://images.unsplash.com/photo-1610964828873-46cc1210a417",
    alt: "Tender slow-braised lamb shank with rich rosemary jus served on creamy polenta with roasted root vegetables",
    popular: true,
    addons: [
      { id: "a12", label: "Extra polenta", price: 2000 },
      { id: "a13", label: "Side bread", price: 1500 },
    ],
  },
];

const INTERFACE_MODES: {
  id: InterfaceMode;
  label: string;
  icon: string;
  desc: string;
}[] = [
  {
    id: "kiosk",
    label: "Kiosk",
    icon: "ComputerDesktopIcon",
    desc: "Self-service standing kiosk",
  },
  {
    id: "tablet",
    label: "Tablet",
    icon: "DeviceTabletIcon",
    desc: "Table-side tablet ordering",
  },
  {
    id: "qr",
    label: "QR Menu",
    icon: "QrCodeIcon",
    desc: "Customer mobile QR scan",
  },
];

const formatPrice = (p: number) => `₮${p.toLocaleString()}`;

// ── Main Component ─────────────────────────────────────────────────────────────

export default function KioskInteractive() {
  const [view, setView] = useState<ViewMode>("welcome");
  const [lang, setLang] = useState<Language>("en");
  const [orderType, setOrderType] = useState<OrderType>("dine-in");
  const [interfaceMode, setInterfaceMode] = useState<InterfaceMode>("kiosk");
  const [selectedCategory, setSelectedCategory] = useState<string>("mains");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [orderNumber, setOrderNumber] = useState("");
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [tableNumber, setTableNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptType, setReceiptType] = useState<ReceiptType>("print");
  const [paidMethod, setPaidMethod] = useState<PanelPaymentMethod>("qpay");
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderTimestamp, setOrderTimestamp] = useState<Date>(new Date());

  const { isOnline, isReconnecting } = useConnectionStatus();

  const t = useCallback(
    (en: string, mn: string) => (lang === "mn" ? mn : en),
    [lang],
  );

  // Idle timeout for kiosk mode
  useEffect(() => {
    if (
      interfaceMode !== "kiosk" ||
      view === "welcome" ||
      view === "confirmation"
    )
      return;
    const timer = setInterval(() => {
      setIdleSeconds((s) => {
        if (s >= 60) {
          setView("welcome");
          setCart([]);
          setIdleSeconds(0);
          return 0;
        }
        return s + 1;
      });
    }, 1000);
    const reset = () => setIdleSeconds(0);
    window.addEventListener("mousemove", reset);
    window.addEventListener("touchstart", reset);
    return () => {
      clearInterval(timer);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("touchstart", reset);
    };
  }, [interfaceMode, view]);

  const filteredItems = MENU_ITEMS.filter(
    (i) => i.categoryId === selectedCategory,
  );
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const openItemDetail = (item: MenuItem) => {
    setSelectedItem(item);
    setSelectedSize(item.sizes?.[0]?.label ?? "");
    setSelectedAddons([]);
    setInstructions("");
    setView("item-detail");
  };

  const addToCart = () => {
    if (!selectedItem) return;
    const sizeObj = selectedItem.sizes?.find((s) => s.label === selectedSize);
    const addonObjs =
      selectedItem.addons?.filter((a) => selectedAddons.includes(a.id)) ?? [];
    const basePrice = sizeObj ? sizeObj.price : selectedItem.price;
    const addonTotal = addonObjs.reduce((s, a) => s + a.price, 0);
    const newItem: CartItem = {
      id: `ci-${Date.now()}`,
      menuItemId: selectedItem.id,
      name: selectedItem.name[lang],
      price: basePrice + addonTotal,
      qty: 1,
      size: selectedSize || undefined,
      addons: addonObjs.map((a) => a.label),
      instructions,
    };
    setCart((prev) => {
      const existing = prev.find(
        (c) =>
          c.menuItemId === newItem.menuItemId &&
          c.size === newItem.size &&
          JSON.stringify(c.addons) === JSON.stringify(newItem.addons),
      );
      if (existing)
        return prev.map((c) =>
          c.id === existing.id ? { ...c, qty: c.qty + 1 } : c,
        );
      return [...prev, newItem];
    });
    setView("menu");
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c,
        )
        .filter((c) => c.qty > 0),
    );
  };

  const placeOrder = async (
    method: PanelPaymentMethod,
    receipt: ReceiptType,
  ) => {
    setIsSubmitting(true);
    setPaidMethod(method);
    setReceiptType(receipt);
    const num = `K${Math.floor(1000 + Math.random() * 9000)}`;

    const items = cart.map((ci) => ({
      id: `item-${Math.random()}`,
      order_id: "",
      name: ci.name,
      qty: ci.qty,
      station: "grill",
      notes: ci.instructions || undefined,
      done: false,
    }));

    await insertOrder(
      {
        order_no: num,
        table_label:
          orderType === "dine-in" ? tableNumber || "Kiosk" : "Takeaway",
        order_type: orderType,
        channel: "Kiosk",
        status: "new",
        station: "grill",
        server_name: "",
        covers: 0,
        items,
        target_minutes: 20,
        elapsed_seconds: 0,
        location: "Main Branch",
        amount: cartTotal,
      },
      isOnline,
    );

    setIsSubmitting(false);
    setOrderNumber(num);
    setOrderTimestamp(new Date());
    setView("confirmation");
    setTimeout(() => {
      if (interfaceMode === "kiosk") {
        setView("welcome");
        setCart([]);
        setShowReceipt(false);
      }
    }, 10000);
  };

  // ── Welcome Screen ─────────────────────────────────────────────────────────

  if (view === "welcome") {
    return (
      <div className="h-full min-h-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
          {/* Interface Mode Switcher */}
          <div className="flex gap-2 bg-white/10 rounded-xl p-1.5 backdrop-blur-sm">
            {INTERFACE_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setInterfaceMode(m.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${interfaceMode === m.id ? "bg-white text-slate-900 shadow-md" : "text-white/70 hover:text-white"}`}
              >
                <Icon name={m.icon} size={16} />
                {m.label}
              </button>
            ))}
          </div>

          {/* Logo & Welcome */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 shadow-elevated">
              <svg width="44" height="44" viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 14L7 9L10.5 12L14 7L17 10"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="17" cy="10" r="1.5" fill="#F59E0B" />
                <path
                  d="M3 17H17"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {t("Welcome to BistroIQ", "BistroIQ-д тавтай морил")}
            </h1>
            <p className="text-white/60 text-lg">
              {t("Touch to start your order", "Захиалга өгөхийн тулд дарна уу")}
            </p>
          </div>

          {/* Language Selection */}
          <div className="flex gap-4">
            {(["en", "mn"] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-200 ${lang === l ? "bg-accent text-slate-900 shadow-elevated scale-105" : "bg-white/10 text-white hover:bg-white/20"}`}
              >
                {l === "en" ? "🇬🇧 English" : "🇲🇳 Монгол"}
              </button>
            ))}
          </div>

          {/* Order Type */}
          <div className="flex gap-6">
            {(["dine-in", "takeaway"] as OrderType[]).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`flex flex-col items-center gap-3 px-12 py-6 rounded-2xl border-2 transition-all duration-200 ${orderType === type ? "border-accent bg-accent/10 text-white" : "border-white/20 bg-white/5 text-white/70 hover:border-white/40 hover:bg-white/10"}`}
              >
                <Icon
                  name={type === "dine-in" ? "HomeIcon" : "ShoppingBagIcon"}
                  size={36}
                />
                <span className="text-xl font-semibold">
                  {type === "dine-in"
                    ? t("Dine In", "Ресторанд")
                    : t("Takeaway", "Авч явах")}
                </span>
              </button>
            ))}
          </div>

          {/* Table number for dine-in */}
          {orderType === "dine-in" && (
            <div className="flex items-center gap-3">
              <label className="text-white/70 text-sm">
                {t("Table Number:", "Ширээний дугаар:")}
              </label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder={t("e.g. 5", "ж.нь. 5")}
                className="w-24 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/30 text-center focus:outline-none focus:border-accent"
              />
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={() => setView("menu")}
            className="px-16 py-5 bg-primary hover:bg-blue-700 text-white text-2xl font-bold rounded-2xl shadow-elevated transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {t("Start Ordering →", "Захиалга эхлэх →")}
          </button>

          {/* QR Code display for QR mode */}
          {interfaceMode === "qr" && (
            <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3">
              <div className="w-32 h-32 bg-slate-900 rounded-xl flex items-center justify-center">
                <Icon name="QrCodeIcon" size={80} className="text-white" />
              </div>
              <p className="text-slate-600 text-sm font-medium">
                {t(
                  "Scan to order from your phone",
                  "Утсаараа скан хийж захиалах",
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Confirmation Screen ────────────────────────────────────────────────────

  if (view === "confirmation") {
    const receiptLabels: Record<ReceiptType, { en: string; mn: string }> = {
      print: { en: "Printing receipt...", mn: "Баримт хэвлэж байна..." },
      email: { en: "Receipt sent to email", mn: "И-мэйлд илгээлээ" },
      sms: { en: "Receipt sent via SMS", mn: "SMS-ээр илгээлээ" },
      none: { en: "No receipt", mn: "Баримтгүй" },
    };
    const methodLabels: Record<PanelPaymentMethod, { en: string; mn: string }> =
      {
        qpay: { en: "QPay", mn: "QPay" },
        card: { en: "Bank Card", mn: "Банкны карт" },
        cash: { en: "Cash", mn: "Бэлэн мөнгө" },
      };

    const receiptData: ReceiptData = {
      orderNumber,
      orderType,
      tableNumber: tableNumber || undefined,
      paymentMethod: paidMethod,
      receiptType,
      items: cart.map((ci) => ({
        name: ci.name,
        qty: ci.qty,
        price: ci.price,
        size: ci.size,
        addons: ci.addons.length > 0 ? ci.addons : undefined,
      })),
      subtotal: cartTotal,
      total: cartTotal,
      timestamp: orderTimestamp,
      lang,
    };

    return (
      <div className="h-full min-h-0 bg-linear-to-br from-green-900 via-emerald-900 to-slate-900 flex flex-col items-center justify-center gap-8 px-6 overflow-y-auto">
        {showReceipt && (
          <ReceiptTemplate
            data={receiptData}
            onClose={() => setShowReceipt(false)}
            onNewOrder={() => {
              setView("welcome");
              setCart([]);
              setShowReceipt(false);
            }}
          />
        )}
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-success flex items-center justify-center mx-auto mb-6 shadow-elevated">
            <Icon name="CheckIcon" size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {t("Order Placed!", "Захиалга баталгаажлаа!")}
          </h1>
          <p className="text-white/60 text-lg">
            {t(
              "Your order is being prepared",
              "Таны захиалга бэлтгэгдэж байна",
            )}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-16 py-8 text-center">
          <p className="text-white/60 text-sm mb-2">
            {t("Order Number", "Захиалгын дугаар")}
          </p>
          <p className="text-6xl font-bold text-accent mono">{orderNumber}</p>
        </div>
        <div className="flex gap-4 flex-wrap justify-center text-center">
          <div className="bg-white/10 rounded-xl px-6 py-4">
            <p className="text-white/60 text-xs mb-1">
              {t("Order Type", "Захиалгын төрөл")}
            </p>
            <p className="text-white font-semibold">
              {orderType === "dine-in"
                ? t("Dine In", "Ресторанд")
                : t("Takeaway", "Авч явах")}
            </p>
          </div>
          {tableNumber && (
            <div className="bg-white/10 rounded-xl px-6 py-4">
              <p className="text-white/60 text-xs mb-1">
                {t("Table", "Ширээ")}
              </p>
              <p className="text-white font-semibold">{tableNumber}</p>
            </div>
          )}
          <div className="bg-white/10 rounded-xl px-6 py-4">
            <p className="text-white/60 text-xs mb-1">
              {t("Est. Time", "Хугацаа")}
            </p>
            <p className="text-white font-semibold">~15 {t("min", "мин")}</p>
          </div>
          <div className="bg-white/10 rounded-xl px-6 py-4">
            <p className="text-white/60 text-xs mb-1">{t("Total", "Нийт")}</p>
            <p className="text-accent font-bold">{formatPrice(cartTotal)}</p>
          </div>
          <div className="bg-white/10 rounded-xl px-6 py-4">
            <p className="text-white/60 text-xs mb-1">
              {t("Payment", "Төлбөр")}
            </p>
            <p className="text-white font-semibold">
              {lang === "mn"
                ? methodLabels[paidMethod].mn
                : methodLabels[paidMethod].en}
            </p>
          </div>
        </div>
        {/* Receipt status */}
        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-5 py-3">
          <Icon name="DocumentTextIcon" size={16} className="text-white/60" />
          <span className="text-white/80 text-sm">
            {lang === "mn"
              ? receiptLabels[receiptType].mn
              : receiptLabels[receiptType].en}
          </span>
        </div>
        {/* Receipt & Action Buttons */}
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => setShowReceipt(true)}
            className="flex items-center gap-2 px-8 py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-semibold transition-all duration-200 shadow-elevated"
          >
            <Icon name="DocumentTextIcon" size={18} />
            {t("View Receipt", "Баримт харах")}
          </button>
          <button
            onClick={() => {
              setView("welcome");
              setCart([]);
            }}
            className="flex items-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200"
          >
            <Icon name="PlusCircleIcon" size={18} />
            {t("New Order", "Шинэ захиалга")}
          </button>
        </div>
      </div>
    );
  }

  // ── Item Detail Modal ──────────────────────────────────────────────────────

  if (view === "item-detail" && selectedItem) {
    const item = selectedItem;
    const sizeObj = item.sizes?.find((s) => s.label === selectedSize);
    const addonObjs =
      item.addons?.filter((a) => selectedAddons.includes(a.id)) ?? [];
    const totalPrice =
      (sizeObj ? sizeObj.price : item.price) +
      addonObjs.reduce((s, a) => s + a.price, 0);

    return (
      <div className="h-full min-h-0 bg-background flex flex-col overflow-y-auto">
        <div className="flex-1 flex items-start justify-center p-6">
          <div className="w-full max-w-2xl bg-card rounded-2xl shadow-elevated overflow-hidden">
            {/* Image */}
            <div className="relative h-64 overflow-hidden">
              <img
                src={item.image}
                alt={item.alt}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setView("menu")}
                className="absolute top-4 left-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
              >
                <Icon name="ArrowLeftIcon" size={20} />
              </button>
              <div className="absolute top-4 right-4 flex gap-2">
                {item.popular && (
                  <span className="px-2 py-1 bg-accent text-slate-900 text-xs font-bold rounded-full">
                    ⭐ {t("Popular", "Алдартай")}
                  </span>
                )}
                {item.spicy && (
                  <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    🌶 {t("Spicy", "Халуун")}
                  </span>
                )}
                {item.vegetarian && (
                  <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                    🌿 {t("Veg", "Ногоон")}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {item.name[lang]}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {item.description[lang]}
                </p>
              </div>

              {/* Size Selection */}
              {item.sizes && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">
                    {t("Choose Size", "Хэмжээ сонгох")}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {item.sizes.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => setSelectedSize(s.label)}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${selectedSize === s.label ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                      >
                        {s.label} — {formatPrice(s.price)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {item.addons && item.addons.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">
                    {t("Add-ons", "Нэмэлт")}
                  </p>
                  <div className="space-y-2">
                    {item.addons.map((a) => (
                      <label
                        key={a.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/40 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedAddons.includes(a.id)}
                            onChange={(e) =>
                              setSelectedAddons((prev) =>
                                e.target.checked
                                  ? [...prev, a.id]
                                  : prev.filter((x) => x !== a.id),
                              )
                            }
                            className="w-4 h-4 accent-primary"
                          />

                          <span className="text-sm text-foreground">
                            {a.label}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          +{formatPrice(a.price)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">
                  {t("Special Instructions", "Тусгай заавар")}
                </p>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={t(
                    "Allergies, preferences, or special requests...",
                    "Харшил, хүсэлт, тусгай заавар...",
                  )}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              {/* Add to Cart */}
              <button
                onClick={addToCart}
                className="w-full py-4 bg-primary hover:bg-blue-700 text-white font-bold text-lg rounded-xl transition-all duration-200 hover:shadow-elevated active:scale-95 flex items-center justify-center gap-3"
              >
                <Icon name="ShoppingCartIcon" size={22} />
                {t("Add to Order", "Захиалгад нэмэх")} —{" "}
                {formatPrice(totalPrice)}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment Screen ─────────────────────────────────────────────────────────

  if (view === "payment") {
    return (
      <div className="h-full min-h-0 bg-background flex flex-col overflow-y-auto">
        <div className="flex-1 flex items-start justify-center p-6">
          <div className="w-full max-w-lg bg-card rounded-2xl shadow-elevated p-6 space-y-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("cart")}
                className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-border transition-all"
              >
                <Icon name="ArrowLeftIcon" size={18} />
              </button>
              <h2 className="text-xl font-bold text-foreground">
                {t("Payment", "Төлбөр")}
              </h2>
            </div>

            {/* Order Summary */}
            <div className="bg-muted rounded-xl p-4 space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {item.qty}× {item.name}
                    {item.size ? ` (${item.size})` : ""}
                  </span>
                  <span className="text-muted-foreground mono">
                    {formatPrice(item.price * item.qty)}
                  </span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between font-bold">
                <span>{t("Total", "Нийт")}</span>
                <span className="text-primary mono">
                  {formatPrice(cartTotal)}
                </span>
              </div>
            </div>

            {/* Payment Panel */}
            <PaymentPanel
              total={cartTotal}
              orderNumber={orderNumber}
              onSuccess={placeOrder}
              onCancel={() => setView("cart")}
              lang={lang}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Cart Screen ────────────────────────────────────────────────────────────

  if (view === "cart") {
    return (
      <div className="h-full min-h-0 bg-background flex flex-col overflow-y-auto">
        <div className="flex-1 flex items-start justify-center p-6">
          <div className="w-full max-w-lg bg-card rounded-2xl shadow-elevated p-6 space-y-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("menu")}
                className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-border transition-all"
              >
                <Icon name="ArrowLeftIcon" size={18} />
              </button>
              <h2 className="text-xl font-bold text-foreground">
                {t("Your Order", "Таны захиалга")}
              </h2>
              <span className="ml-auto text-sm text-muted-foreground">
                {cartCount} {t("items", "зүйл")}
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <Icon
                  name="ShoppingCartIcon"
                  size={48}
                  className="text-muted-foreground mx-auto mb-3"
                />
                <p className="text-muted-foreground">
                  {t("Your cart is empty", "Таны сагс хоосон байна")}
                </p>
                <button
                  onClick={() => setView("menu")}
                  className="mt-4 px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium"
                >
                  {t("Browse Menu", "Цэс үзэх")}
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-4 bg-muted rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">
                          {item.name}
                        </p>
                        {item.size && (
                          <p className="text-xs text-muted-foreground">
                            {item.size}
                          </p>
                        )}
                        {item.addons.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            +{item.addons.join(", ")}
                          </p>
                        )}
                        {item.instructions && (
                          <p className="text-xs text-muted-foreground italic">
                            {`"${item.instructions}"`}
                          </p>
                        )}
                        <p className="text-sm font-bold text-primary mt-1 mono">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-8 h-8 rounded-lg bg-border hover:bg-muted-foreground/20 flex items-center justify-center transition-all"
                        >
                          <Icon name="MinusIcon" size={14} />
                        </button>
                        <span className="w-6 text-center font-bold text-foreground mono">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-blue-700 transition-all"
                        >
                          <Icon name="PlusIcon" size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t("Subtotal", "Дүн")}</span>
                    <span className="mono">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t("Total", "Нийт")}</span>
                    <span className="text-primary mono">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setView("payment")}
                  className="w-full py-4 bg-primary hover:bg-blue-700 text-white font-bold text-lg rounded-xl transition-all duration-200 hover:shadow-elevated active:scale-95"
                >
                  {t("Proceed to Payment →", "Төлбөр рүу →")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Menu Screen ────────────────────────────────────────────────────────────

  return (
    <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden">
      {/* Idle warning for kiosk */}
      {interfaceMode === "kiosk" && idleSeconds >= 45 && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-card rounded-2xl p-8 text-center shadow-modal max-w-sm mx-4">
            <Icon
              name="ClockIcon"
              size={48}
              className="text-warning mx-auto mb-4"
            />
            <h3 className="text-xl font-bold text-foreground mb-2">
              {t("Still there?", "Та байна уу?")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t(
                `Returning to start in ${60 - idleSeconds}s`,
                `${60 - idleSeconds}с дараа буцна`,
              )}
            </p>
            <button
              onClick={() => setIdleSeconds(0)}
              className="px-8 py-3 bg-primary text-white rounded-xl font-semibold"
            >
              {t("Continue", "Үргэлжлүүлэх")}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1">
        {/* Top Bar */}
        <div className="bg-card border-b border-border px-6 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${orderType === "dine-in" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}
            >
              {orderType === "dine-in"
                ? t("Dine In", "Ресторанд")
                : t("Takeaway", "Авч явах")}
              {tableNumber ? ` · ${t("Table", "Ширээ")} ${tableNumber}` : ""}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              {INTERFACE_MODES.find((m) => m.id === interfaceMode)?.label}
            </span>
          </div>
          <div className="flex-1" />
          <div className="flex gap-2">
            {(["en", "mn"] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${lang === l ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-border"}`}
              >
                {l === "en" ? "EN" : "МН"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setView("cart")}
            className="relative flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all"
          >
            <Icon name="ShoppingCartIcon" size={18} />
            {t("Cart", "Сагс")}
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-accent text-slate-900 text-xs font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setView("welcome");
              setCart([]);
            }}
            className="px-3 py-2 bg-muted hover:bg-border text-muted-foreground rounded-xl text-sm transition-all"
          >
            {t("Exit", "Гарах")}
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Category Sidebar */}
          <div className="w-48 shrink-0 bg-card border-r border-border overflow-y-auto">
            <div className="p-3 space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 ${selectedCategory === cat.id ? "bg-primary text-white shadow-card" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  <Icon name={cat.icon} size={18} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">
                      {cat.name[lang]}
                    </p>
                    <p
                      className={`text-[10px] ${selectedCategory === cat.id ? "text-white/70" : "text-muted-foreground"}`}
                    >
                      {cat.count} {t("items", "зүйл")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-foreground">
                {CATEGORIES.find((c) => c.id === selectedCategory)?.name[lang]}
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredItems.length} {t("items available", "зүйл байна")}
              </p>
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-16">
                <Icon
                  name="ArchiveBoxIcon"
                  size={48}
                  className="text-muted-foreground mx-auto mb-3"
                />
                <p className="text-muted-foreground">
                  {t("No items in this category", "Энэ ангилалд зүйл байхгүй")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openItemDetail(item)}
                    className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 text-left group"
                  >
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.alt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                        {item.popular && (
                          <span className="px-2 py-0.5 bg-accent text-slate-900 text-[10px] font-bold rounded-full">
                            ⭐ {t("Popular", "Алдартай")}
                          </span>
                        )}
                        {item.spicy && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                            🌶
                          </span>
                        )}
                        {item.vegetarian && (
                          <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full">
                            🌿
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-foreground text-sm leading-tight mb-1">
                        {item.name[lang]}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {item.description[lang]}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary mono">
                          {formatPrice(item.price)}
                        </span>
                        <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-all">
                          <Icon name="PlusIcon" size={16} />
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
