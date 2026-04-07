import { MenuItemModel } from "../schemas/menu-item.schema.js";

export class MenuRepository {
  static list(tenantId: string, branchId: string) {
    return MenuItemModel.find({ tenantId, branchId }).sort({ category: 1, name: 1 }).lean();
  }

  static create(input: {
    tenantId: string;
    branchId: string;
    category: string;
    sku: string;
    name: string;
    description?: string;
    price: number;
    available?: boolean;
    prepStation?: string;
    tags?: string[];
    ingredients?: Array<{
      inventoryItemId: string;
      inventoryItemName: string;
      quantity: number;
      unit: string;
      wastePercent?: number;
    }>;
    isSeasonal?: boolean;
    seasonStartDate?: string;
    seasonEndDate?: string;
    serviceWindows?: Array<{
      label?: string;
      daysOfWeek: number[];
      startTime: string;
      endTime: string;
      enabled?: boolean;
    }>;
  }) {
    return MenuItemModel.create(input);
  }

  static update(input: {
    tenantId: string;
    branchId: string;
    id: string;
    category?: string;
    sku?: string;
    name?: string;
    description?: string;
    price?: number;
    available?: boolean;
    prepStation?: string;
    tags?: string[];
    ingredients?: Array<{
      inventoryItemId: string;
      inventoryItemName: string;
      quantity: number;
      unit: string;
      wastePercent?: number;
    }>;
    isSeasonal?: boolean;
    seasonStartDate?: string;
    seasonEndDate?: string;
    serviceWindows?: Array<{
      label?: string;
      daysOfWeek: number[];
      startTime: string;
      endTime: string;
      enabled?: boolean;
    }>;
  }) {
    const { id, tenantId, branchId, ...patch } = input;
    const setPatch = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined)
    );

    return MenuItemModel.findOneAndUpdate(
      {
        _id: id,
        tenantId,
        branchId
      },
      {
        $set: setPatch
      },
      { new: true }
    ).lean();
  }

  static updateAvailability(input: {
    tenantId: string;
    branchId: string;
    id: string;
    available: boolean;
  }) {
    return MenuItemModel.findOneAndUpdate(
      {
        _id: input.id,
        tenantId: input.tenantId,
        branchId: input.branchId
      },
      {
        $set: {
          available: input.available
        }
      },
      { new: true }
    ).lean();
  }
}
