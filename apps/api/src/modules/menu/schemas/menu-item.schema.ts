import mongoose, { type Model, Schema, model } from "mongoose";

export interface MenuIngredient {
  inventoryItemId: string;
  inventoryItemName: string;
  quantity: number;
  unit: string;
  wastePercent: number;
}

export interface MenuServiceWindow {
  label: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export interface MenuItem {
  tenantId: string;
  branchId: string;
  category: string;
  sku: string;
  name: string;
  description?: string | null;
  price: number;
  available: boolean;
  prepStation: string;
  tags: string[];
  ingredients: MenuIngredient[];
  isSeasonal: boolean;
  seasonStartDate?: Date | null;
  seasonEndDate?: Date | null;
  serviceWindows: MenuServiceWindow[];
  createdAt: Date;
  updatedAt: Date;
}

const ingredientSchema = new Schema<MenuIngredient>(
  {
    inventoryItemId: { type: String, required: true },
    inventoryItemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.001 },
    unit: { type: String, required: true },
    wastePercent: { type: Number, min: 0, max: 100, default: 0 }
  },
  { _id: false }
);

const serviceWindowSchema = new Schema<MenuServiceWindow>(
  {
    label: { type: String, default: "Window" },
    daysOfWeek: { type: [Number], default: [] },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    enabled: { type: Boolean, default: true }
  },
  { _id: false }
);

const menuItemSchema = new Schema<MenuItem>(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: String, required: true, index: true },
    category: { type: String, required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    available: { type: Boolean, default: true },
    prepStation: { type: String, default: "main" },
    tags: { type: [String], default: [] },
    ingredients: { type: [ingredientSchema], default: [] },
    isSeasonal: { type: Boolean, default: false },
    seasonStartDate: { type: Date, default: null },
    seasonEndDate: { type: Date, default: null },
    serviceWindows: { type: [serviceWindowSchema], default: [] }
  },
  {
    timestamps: true,
    collection: "menu_items"
  }
);

menuItemSchema.index({ tenantId: 1, branchId: 1, sku: 1 }, { unique: true });

export const MenuItemModel =
  (mongoose.models.MenuItem as Model<MenuItem> | undefined) ??
  model<MenuItem>("MenuItem", menuItemSchema);
