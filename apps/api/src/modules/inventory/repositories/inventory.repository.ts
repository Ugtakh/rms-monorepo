import { Prisma } from "@prisma/client";
import { prisma } from "../../../infrastructure/database/postgres/prisma.js";

export class InventoryRepository {
  static list(tenantId: string, branchId: string) {
    return prisma.inventoryItem.findMany({
      where: {
        tenantId,
        branchId
      },
      orderBy: {
        name: "asc"
      }
    });
  }

  static create(input: {
    tenantId: string;
    branchId: string;
    sku: string;
    name: string;
    unit: string;
    onHand: number;
    reorderLevel: number;
    averageCost: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          tenantId: input.tenantId,
          branchId: input.branchId,
          sku: input.sku,
          name: input.name,
          unit: input.unit,
          onHand: new Prisma.Decimal(input.onHand),
          reorderLevel: new Prisma.Decimal(input.reorderLevel),
          averageCost: new Prisma.Decimal(input.averageCost)
        }
      });

      await tx.inventoryLedger.create({
        data: {
          tenantId: input.tenantId,
          branchId: input.branchId,
          inventoryItemId: item.id,
          movementType: "OPENING",
          quantity: new Prisma.Decimal(input.onHand),
          unitCost: new Prisma.Decimal(input.averageCost),
          referenceNo: "OPENING-BALANCE"
        }
      });

      return item;
    });
  }

  static adjustStock(input: {
    tenantId: string;
    branchId: string;
    id: string;
    quantity: number;
    movementType: "IN" | "OUT" | "ADJUSTMENT";
    unitCost?: number;
    note?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({
        where: {
          id: input.id,
          tenantId: input.tenantId,
          branchId: input.branchId
        }
      });

      if (!item) {
        return null;
      }

      const nextOnHand =
        input.movementType === "OUT"
          ? item.onHand.minus(input.quantity)
          : item.onHand.plus(input.quantity);

      if (nextOnHand.lessThan(0)) {
        throw new Error("Insufficient stock");
      }

      const updated = await tx.inventoryItem.update({
        where: {
          id: item.id
        },
        data: {
          onHand: nextOnHand,
          averageCost: input.unitCost ? new Prisma.Decimal(input.unitCost) : undefined
        }
      });

      await tx.inventoryLedger.create({
        data: {
          tenantId: input.tenantId,
          branchId: input.branchId,
          inventoryItemId: item.id,
          movementType: input.movementType,
          quantity: new Prisma.Decimal(input.quantity),
          unitCost: input.unitCost ? new Prisma.Decimal(input.unitCost) : null,
          note: input.note
        }
      });

      return updated;
    });
  }
}
