import { StatusCodes } from "http-status-codes";
import { AppError } from "../../../common/errors/app-error.js";
import { MenuRepository } from "../repositories/menu.repository.js";

export class MenuService {
  static async list(tenantId: string, branchId: string) {
    return MenuRepository.list(tenantId, branchId);
  }

  static async create(input: {
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
    try {
      return await MenuRepository.create(input);
    } catch (error) {
      const candidate = error as { code?: number };
      if (candidate.code === 11000) {
        throw new AppError("SKU already exists in this branch", StatusCodes.CONFLICT, "MENU_SKU_EXISTS");
      }
      throw error;
    }
  }

  static async update(input: {
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
    try {
      return await MenuRepository.update(input);
    } catch (error) {
      const candidate = error as { code?: number };
      if (candidate.code === 11000) {
        throw new AppError("SKU already exists in this branch", StatusCodes.CONFLICT, "MENU_SKU_EXISTS");
      }
      throw error;
    }
  }

  static async updateAvailability(input: {
    tenantId: string;
    branchId: string;
    id: string;
    available: boolean;
  }) {
    return MenuRepository.updateAvailability(input);
  }
}
