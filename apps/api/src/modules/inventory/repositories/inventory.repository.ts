import { eq, and } from "drizzle-orm";
import { db } from "../../../infrastructure/database/postgres/db.js";
import { inventoryItems, inventoryLedgers } from "../../../infrastructure/database/postgres/schema.js";

export class InventoryRepository {
  static list(tenantId: string, branchId: string) {
    return db.query.inventoryItems.findMany({
      where: and(eq(inventoryItems.tenantId, tenantId), eq(inventoryItems.branchId, branchId)),
      orderBy: (t, { asc }) => [asc(t.name)]
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
    return db.transaction(async (tx) => {
      const [item] = await tx
        .insert(inventoryItems)
        .values({
          tenantId: input.tenantId,
          branchId: input.branchId,
          sku: input.sku,
          name: input.name,
          unit: input.unit,
          onHand: String(input.onHand),
          reorderLevel: String(input.reorderLevel),
          averageCost: String(input.averageCost)
        })
        .returning();

      await tx.insert(inventoryLedgers).values({
        tenantId: input.tenantId,
        branchId: input.branchId,
        inventoryItemId: item!.id,
        movementType: "OPENING",
        quantity: String(input.onHand),
        unitCost: String(input.averageCost),
        referenceNo: "OPENING-BALANCE"
      });

      return item!;
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
    return db.transaction(async (tx) => {
      const item = await tx.query.inventoryItems.findFirst({
        where: and(
          eq(inventoryItems.id, input.id),
          eq(inventoryItems.tenantId, input.tenantId),
          eq(inventoryItems.branchId, input.branchId)
        )
      });

      if (!item) return null;

      const currentOnHand = Number(item.onHand);
      const nextOnHand =
        input.movementType === "OUT"
          ? currentOnHand - input.quantity
          : currentOnHand + input.quantity;

      if (nextOnHand < 0) throw new Error("Insufficient stock");

      const [updated] = await tx
        .update(inventoryItems)
        .set({
          onHand: String(nextOnHand),
          ...(input.unitCost ? { averageCost: String(input.unitCost) } : {})
        })
        .where(eq(inventoryItems.id, item.id))
        .returning();

      await tx.insert(inventoryLedgers).values({
        tenantId: input.tenantId,
        branchId: input.branchId,
        inventoryItemId: item.id,
        movementType: input.movementType,
        quantity: String(input.quantity),
        unitCost: input.unitCost ? String(input.unitCost) : null,
        note: input.note
      });

      return updated!;
    });
  }
}
