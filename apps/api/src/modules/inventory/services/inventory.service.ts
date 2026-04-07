import { StatusCodes } from "http-status-codes";
import { AppError } from "../../../common/errors/app-error.js";
import { InventoryRepository } from "../repositories/inventory.repository.js";

export class InventoryService {
  static async list(tenantId: string, branchId: string) {
    return InventoryRepository.list(tenantId, branchId);
  }

  static async create(input: {
    tenantId: string;
    branchId: string;
    sku: string;
    name: string;
    unit: string;
    onHand: number;
    reorderLevel: number;
    averageCost: number;
  }) {
    try {
      return await InventoryRepository.create(input);
    } catch (error) {
      const candidate = error as { code?: string };
      if (candidate.code === "P2002") {
        throw new AppError("SKU already exists in this branch", StatusCodes.CONFLICT, "INVENTORY_SKU_EXISTS");
      }

      throw error;
    }
  }

  static async adjust(input: {
    tenantId: string;
    branchId: string;
    id: string;
    quantity: number;
    movementType: "IN" | "OUT" | "ADJUSTMENT";
    unitCost?: number;
    note?: string;
  }) {
    try {
      const updated = await InventoryRepository.adjustStock(input);

      if (!updated) {
        throw new AppError("Inventory item not found", StatusCodes.NOT_FOUND, "INVENTORY_NOT_FOUND");
      }

      return updated;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        (error as Error).message,
        StatusCodes.BAD_REQUEST,
        "INVENTORY_ADJUSTMENT_FAILED"
      );
    }
  }
}
