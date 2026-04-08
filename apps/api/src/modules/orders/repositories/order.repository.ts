import { eq, and, desc } from "drizzle-orm";
import { db } from "../../../infrastructure/database/postgres/db.js";
import { orders, orderItems } from "../../../infrastructure/database/postgres/schema.js";
import type { OrderStatus, PaymentStatus } from "../../../infrastructure/database/postgres/schema.js";

export interface CreateOrderRepositoryInput {
  tenantId: string;
  branchId: string;
  tableId: string | null;
  createdById: string;
  orderNo: string;
  guestName?: string;
  note?: string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  serviceAmount: number;
  discountAmount: number;
  totalAmount: number;
  items: Array<{
    menuItemId: string;
    sku?: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    lineTotal: number;
    note?: string;
  }>;
}

const orderWith = {
  with: { items: true, payments: true, table: true }
} as const;

export class OrderRepository {
  static list(tenantId: string, branchId: string) {
    return db.query.orders.findMany({
      where: and(eq(orders.tenantId, tenantId), eq(orders.branchId, branchId)),
      ...orderWith,
      orderBy: [desc(orders.createdAt)],
      limit: 100
    });
  }

  static async create(input: CreateOrderRepositoryInput) {
    return db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          tenantId: input.tenantId,
          branchId: input.branchId,
          tableId: input.tableId,
          createdById: input.createdById,
          orderNo: input.orderNo,
          guestName: input.guestName,
          note: input.note,
          status: input.status,
          paymentStatus: "UNPAID",
          subtotal: String(input.subtotal),
          taxAmount: String(input.taxAmount),
          serviceAmount: String(input.serviceAmount),
          discountAmount: String(input.discountAmount),
          totalAmount: String(input.totalAmount)
        })
        .returning();

      await tx.insert(orderItems).values(
        input.items.map((item) => ({
          orderId: order!.id,
          menuItemId: item.menuItemId,
          sku: item.sku,
          itemName: item.itemName,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          discount: String(item.discount),
          lineTotal: String(item.lineTotal),
          note: item.note
        }))
      );

      return db.query.orders.findFirst({
        where: eq(orders.id, order!.id),
        ...orderWith
      });
    });
  }

  static findById(input: { id: string; tenantId: string; branchId: string }) {
    return db.query.orders.findFirst({
      where: and(
        eq(orders.id, input.id),
        eq(orders.tenantId, input.tenantId),
        eq(orders.branchId, input.branchId)
      ),
      ...orderWith
    });
  }

  static async updateStatus(input: {
    id: string;
    tenantId: string;
    branchId: string;
    status: OrderStatus;
    paymentStatus?: PaymentStatus;
  }) {
    await db
      .update(orders)
      .set({
        status: input.status,
        paymentStatus: input.paymentStatus,
        closedAt: input.status === "CLOSED" ? new Date() : null
      })
      .where(eq(orders.id, input.id));

    return db.query.orders.findFirst({ where: eq(orders.id, input.id), ...orderWith });
  }

  static async markPaymentStatus(id: string, paymentStatus: PaymentStatus) {
    await db
      .update(orders)
      .set({
        paymentStatus,
        ...(paymentStatus === "PAID" ? { status: "CLOSED" as OrderStatus, closedAt: new Date() } : {})
      })
      .where(eq(orders.id, id));

    return db.query.orders.findFirst({ where: eq(orders.id, id), ...orderWith });
  }
}
