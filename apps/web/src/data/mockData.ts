export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "preparing" | "ready" | "served";
  table: number;
  createdAt: Date;
  type: "dine-in" | "takeout";
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  lastRestocked: string;
}

export const menuCategories = ["Үндсэн", "Зууш", "Ундаа", "Амттан"];

export const menuItems: MenuItem[] = [
  {
    id: "1",
    name: "Шарсан мах",
    price: 18500,
    category: "Үндсэн",
    emoji: "🥩",
  },
  { id: "2", name: "Цуйван", price: 12000, category: "Үндсэн", emoji: "🍜" },
  { id: "3", name: "Хуушуур", price: 3500, category: "Үндсэн", emoji: "🥟" },
  { id: "4", name: "Бууз", price: 4000, category: "Үндсэн", emoji: "🫓" },
  {
    id: "5",
    name: "Банштай шөл",
    price: 8500,
    category: "Үндсэн",
    emoji: "🍲",
  },
  {
    id: "6",
    name: "Ногоотой салат",
    price: 7500,
    category: "Зууш",
    emoji: "🥗",
  },
  {
    id: "7",
    name: "Бяслагтай өрөм",
    price: 6500,
    category: "Зууш",
    emoji: "🧀",
  },
  {
    id: "8",
    name: "Төмсний шарсан",
    price: 5500,
    category: "Зууш",
    emoji: "🍟",
  },
  { id: "9", name: "Сүүтэй цай", price: 2500, category: "Ундаа", emoji: "🍵" },
  { id: "10", name: "Кока кола", price: 3000, category: "Ундаа", emoji: "🥤" },
  { id: "11", name: "Жүүс", price: 4500, category: "Ундаа", emoji: "🧃" },
  { id: "12", name: "Бин кофе", price: 5500, category: "Ундаа", emoji: "☕" },
  { id: "13", name: "Бялуу", price: 8000, category: "Амттан", emoji: "🍰" },
  { id: "14", name: "Зайрмаг", price: 5000, category: "Амттан", emoji: "🍨" },
  {
    id: "15",
    name: "Жимсний салат",
    price: 6000,
    category: "Амттан",
    emoji: "🍓",
  },
];

export const sampleOrders: Order[] = [
  {
    id: "ORD-001",
    items: [
      { menuItem: menuItems[0], quantity: 2 },
      { menuItem: menuItems[8], quantity: 2 },
    ],
    total: 41500,
    status: "preparing",
    table: 3,
    createdAt: new Date(Date.now() - 15 * 60000),
    type: "dine-in",
  },
  {
    id: "ORD-002",
    items: [
      { menuItem: menuItems[1], quantity: 1 },
      { menuItem: menuItems[5], quantity: 1 },
      { menuItem: menuItems[9], quantity: 1 },
    ],
    total: 22500,
    status: "pending",
    table: 7,
    createdAt: new Date(Date.now() - 5 * 60000),
    type: "dine-in",
  },
  {
    id: "ORD-003",
    items: [
      { menuItem: menuItems[2], quantity: 4 },
      { menuItem: menuItems[3], quantity: 6 },
    ],
    total: 38000,
    status: "ready",
    table: 1,
    createdAt: new Date(Date.now() - 25 * 60000),
    type: "takeout",
  },
  {
    id: "ORD-004",
    items: [
      { menuItem: menuItems[4], quantity: 2 },
      { menuItem: menuItems[12], quantity: 2 },
    ],
    total: 33000,
    status: "pending",
    table: 5,
    createdAt: new Date(Date.now() - 2 * 60000),
    type: "dine-in",
  },
];

export const inventoryItems: InventoryItem[] = [
  {
    id: "1",
    name: "Үхрийн мах",
    category: "Мах",
    quantity: 45,
    unit: "кг",
    minStock: 20,
    costPerUnit: 18000,
    lastRestocked: "2026-03-10",
  },
  {
    id: "2",
    name: "Хонины мах",
    category: "Мах",
    quantity: 30,
    unit: "кг",
    minStock: 15,
    costPerUnit: 15000,
    lastRestocked: "2026-03-09",
  },
  {
    id: "3",
    name: "Гурил",
    category: "Хүнс",
    quantity: 80,
    unit: "кг",
    minStock: 30,
    costPerUnit: 3500,
    lastRestocked: "2026-03-08",
  },
  {
    id: "4",
    name: "Төмс",
    category: "Ногоо",
    quantity: 60,
    unit: "кг",
    minStock: 25,
    costPerUnit: 2000,
    lastRestocked: "2026-03-10",
  },
  {
    id: "5",
    name: "Байцаа",
    category: "Ногоо",
    quantity: 8,
    unit: "кг",
    minStock: 10,
    costPerUnit: 4000,
    lastRestocked: "2026-03-07",
  },
  {
    id: "6",
    name: "Сонгино",
    category: "Ногоо",
    quantity: 20,
    unit: "кг",
    minStock: 10,
    costPerUnit: 3000,
    lastRestocked: "2026-03-09",
  },
  {
    id: "7",
    name: "Цөцгийн тос",
    category: "Сүүн бүтээгдэхүүн",
    quantity: 12,
    unit: "кг",
    minStock: 5,
    costPerUnit: 12000,
    lastRestocked: "2026-03-10",
  },
  {
    id: "8",
    name: "Ургамлын тос",
    category: "Тос",
    quantity: 25,
    unit: "л",
    minStock: 10,
    costPerUnit: 8000,
    lastRestocked: "2026-03-08",
  },
  {
    id: "9",
    name: "Цай",
    category: "Ундаа",
    quantity: 5,
    unit: "кг",
    minStock: 8,
    costPerUnit: 25000,
    lastRestocked: "2026-03-06",
  },
  {
    id: "10",
    name: "Кока кола",
    category: "Ундаа",
    quantity: 48,
    unit: "ш",
    minStock: 24,
    costPerUnit: 1800,
    lastRestocked: "2026-03-10",
  },
];

export interface Employee {
  id: string;
  name: string;
  role: "Менежер" | "Тогооч" | "Зөөгч" | "Кассчин" | "Угаагч";
  phone: string;
  email: string;
  status: "active" | "off" | "vacation";
  shift: "morning" | "evening" | "night";
  salary: number;
  startDate: string;
  avatar: string;
}

export interface TableInfo {
  id: number;
  seats: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
  x: number;
  y: number;
  width: number;
  height: number;
  shape: "rect" | "circle";
  orderId?: string;
  guestCount?: number;
}

export interface ReportData {
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  weeklyComparison: { day: string; thisWeek: number; lastWeek: number }[];
}

export const employees: Employee[] = [
  {
    id: "E001",
    name: "Батбаяр Д.",
    role: "Менежер",
    phone: "9911-2233",
    email: "batbayar@rest.mn",
    status: "active",
    shift: "morning",
    salary: 2500000,
    startDate: "2024-01-15",
    avatar: "👨‍💼",
  },
  {
    id: "E002",
    name: "Сарангэрэл Б.",
    role: "Тогооч",
    phone: "9922-3344",
    email: "sarangerel@rest.mn",
    status: "active",
    shift: "morning",
    salary: 1800000,
    startDate: "2024-03-20",
    avatar: "👩‍🍳",
  },
  {
    id: "E003",
    name: "Төмөрбаатар О.",
    role: "Тогооч",
    phone: "9933-4455",
    email: "tomorbaatar@rest.mn",
    status: "active",
    shift: "evening",
    salary: 1800000,
    startDate: "2024-05-10",
    avatar: "👨‍🍳",
  },
  {
    id: "E004",
    name: "Оюунчимэг Г.",
    role: "Зөөгч",
    phone: "9944-5566",
    email: "oyuunchimeg@rest.mn",
    status: "active",
    shift: "morning",
    salary: 1200000,
    startDate: "2025-01-05",
    avatar: "👩‍🍳",
  },
  {
    id: "E005",
    name: "Ганбаатар Э.",
    role: "Зөөгч",
    phone: "9955-6677",
    email: "ganbaatar@rest.mn",
    status: "off",
    shift: "evening",
    salary: 1200000,
    startDate: "2025-02-14",
    avatar: "🧑‍🍳",
  },
  {
    id: "E006",
    name: "Нарангэрэл С.",
    role: "Кассчин",
    phone: "9966-7788",
    email: "narangerel@rest.mn",
    status: "active",
    shift: "morning",
    salary: 1400000,
    startDate: "2024-08-01",
    avatar: "👩‍💻",
  },
  {
    id: "E007",
    name: "Энхбат Т.",
    role: "Тогооч",
    phone: "9977-8899",
    email: "enkhbat@rest.mn",
    status: "vacation",
    shift: "night",
    salary: 1800000,
    startDate: "2024-06-15",
    avatar: "👨‍🍳",
  },
  {
    id: "E008",
    name: "Цэцэгмаа Л.",
    role: "Угаагч",
    phone: "9988-9900",
    email: "tsetsegmaa@rest.mn",
    status: "active",
    shift: "morning",
    salary: 900000,
    startDate: "2025-06-01",
    avatar: "👩",
  },
];

export const floorTables: TableInfo[] = [
  {
    id: 1,
    seats: 4,
    status: "occupied",
    x: 80,
    y: 80,
    width: 90,
    height: 90,
    shape: "rect",
    orderId: "ORD-003",
    guestCount: 3,
  },
  {
    id: 2,
    seats: 2,
    status: "available",
    x: 220,
    y: 80,
    width: 70,
    height: 70,
    shape: "circle",
  },
  {
    id: 3,
    seats: 4,
    status: "occupied",
    x: 350,
    y: 80,
    width: 90,
    height: 90,
    shape: "rect",
    orderId: "ORD-001",
    guestCount: 4,
  },
  {
    id: 4,
    seats: 6,
    status: "reserved",
    x: 520,
    y: 80,
    width: 120,
    height: 90,
    shape: "rect",
  },
  {
    id: 5,
    seats: 4,
    status: "occupied",
    x: 80,
    y: 230,
    width: 90,
    height: 90,
    shape: "rect",
    orderId: "ORD-004",
    guestCount: 2,
  },
  {
    id: 6,
    seats: 2,
    status: "available",
    x: 220,
    y: 230,
    width: 70,
    height: 70,
    shape: "circle",
  },
  {
    id: 7,
    seats: 4,
    status: "occupied",
    x: 350,
    y: 230,
    width: 90,
    height: 90,
    shape: "rect",
    orderId: "ORD-002",
    guestCount: 3,
  },
  {
    id: 8,
    seats: 8,
    status: "available",
    x: 500,
    y: 220,
    width: 160,
    height: 100,
    shape: "rect",
  },
  {
    id: 9,
    seats: 2,
    status: "cleaning",
    x: 80,
    y: 380,
    width: 70,
    height: 70,
    shape: "circle",
  },
  {
    id: 10,
    seats: 4,
    status: "available",
    x: 220,
    y: 380,
    width: 90,
    height: 90,
    shape: "rect",
  },
  {
    id: 11,
    seats: 4,
    status: "reserved",
    x: 370,
    y: 380,
    width: 90,
    height: 90,
    shape: "rect",
  },
  {
    id: 12,
    seats: 6,
    status: "available",
    x: 520,
    y: 380,
    width: 120,
    height: 90,
    shape: "rect",
  },
];

export const reportData: ReportData = {
  dailyRevenue: [
    { date: "03/05", revenue: 1850000, orders: 52 },
    { date: "03/06", revenue: 2100000, orders: 58 },
    { date: "03/07", revenue: 2350000, orders: 64 },
    { date: "03/08", revenue: 2800000, orders: 78 },
    { date: "03/09", revenue: 3100000, orders: 85 },
    { date: "03/10", revenue: 2650000, orders: 72 },
    { date: "03/11", revenue: 2450000, orders: 67 },
  ],
  categoryBreakdown: [
    { category: "Үндсэн хоол", amount: 1200000, percentage: 49 },
    { category: "Зууш", amount: 350000, percentage: 14 },
    { category: "Ундаа", amount: 550000, percentage: 22 },
    { category: "Амттан", amount: 350000, percentage: 15 },
  ],
  weeklyComparison: [
    { day: "Дав", thisWeek: 1850000, lastWeek: 1650000 },
    { day: "Мяг", thisWeek: 2100000, lastWeek: 1900000 },
    { day: "Лха", thisWeek: 2350000, lastWeek: 2100000 },
    { day: "Пүр", thisWeek: 2800000, lastWeek: 2500000 },
    { day: "Баа", thisWeek: 3100000, lastWeek: 2900000 },
    { day: "Бям", thisWeek: 2650000, lastWeek: 2400000 },
    { day: "Ням", thisWeek: 2450000, lastWeek: 2200000 },
  ],
};

export const dashboardStats = {
  todayRevenue: 2450000,
  todayOrders: 67,
  avgOrderValue: 36567,
  activeOrders: 12,
  topItems: [
    { name: "Хуушуур", count: 45 },
    { name: "Бууз", count: 38 },
    { name: "Цуйван", count: 32 },
    { name: "Шарсан мах", count: 28 },
    { name: "Сүүтэй цай", count: 55 },
  ],
  hourlyRevenue: [
    { hour: "10:00", revenue: 120000 },
    { hour: "11:00", revenue: 280000 },
    { hour: "12:00", revenue: 520000 },
    { hour: "13:00", revenue: 480000 },
    { hour: "14:00", revenue: 350000 },
    { hour: "15:00", revenue: 180000 },
    { hour: "16:00", revenue: 150000 },
    { hour: "17:00", revenue: 220000 },
    { hour: "18:00", revenue: 410000 },
    { hour: "19:00", revenue: 480000 },
    { hour: "20:00", revenue: 320000 },
  ],
};
