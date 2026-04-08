import { eq, and } from "drizzle-orm";
import { db } from "../../../infrastructure/database/postgres/db.js";
import { orders, payments } from "../../../infrastructure/database/postgres/schema.js";
import type { PaymentMethod, PaymentStatus } from "../../../infrastructure/database/postgres/schema.js";
import type { OrderPaymentSnapshot } from "../../ebarimt/services/ebarimt.service.js";

export class PaymentsRepository {
  static async getOrderSnapshot(input: {
    tenantId: string;
    branchId: string;
    orderId: string;
  }): Promise<OrderPaymentSnapshot | null> {
    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, input.orderId),
        eq(orders.tenantId, input.tenantId),
        eq(orders.branchId, input.branchId)
      ),
      with: { items: true, payments: true }
    });

    if (!order) return null;

    return {
      id: order.id,
      orderNo: order.orderNo,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      serviceAmount: Number(order.serviceAmount),
      totalAmount: Number(order.totalAmount),
      items: order.items.map((item) => ({
        itemName: item.itemName,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
        sku: item.sku
      })),
      payments: order.payments.map((payment) => ({
        amount: Number(payment.amount),
        method: payment.method,
        status: payment.status,
        payload: payment.payload ?? undefined
      }))
    };
  }

  static async create(input: {
    tenantId: string;
    branchId: string;
    orderId: string;
    createdById: string;
    amount: number;
    method: PaymentMethod;
    externalRef?: string;
    payload?: unknown;
  }) {
    return db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({
        where: and(
          eq(orders.id, input.orderId),
          eq(orders.tenantId, input.tenantId),
          eq(orders.branchId, input.branchId)
        ),
        with: { payments: true }
      });

      if (!order) return null;

      const safePayload =
        input.payload && typeof input.payload === "object" && !Array.isArray(input.payload)
          ? input.payload
          : {};

      await tx.insert(payments).values({
        tenantId: input.tenantId,
        branchId: input.branchId,
        orderId: order.id,
        createdById: input.createdById,
        amount: String(input.amount),
        method: input.method,
        status: "PAID" as PaymentStatus,
        externalRef: input.externalRef,
        payload: safePayload
      });

      const totalPaid =
        order.payments.reduce((acc, p) => acc + Number(p.amount), 0) + input.amount;
      const totalAmount = Number(order.totalAmount);

      const paymentStatus: PaymentStatus =
        totalPaid >= totalAmount ? "PAID" : totalPaid > 0 ? "PARTIAL" : "UNPAID";

      await tx
        .update(orders)
        .set({
          paymentStatus,
          ...(paymentStatus === "PAID" ? { status: "CLOSED" as const, closedAt: new Date() } : {})
        })
        .where(eq(orders.id, order.id));

      return tx.query.orders.findFirst({
        where: eq(orders.id, order.id),
        with: { items: true, payments: true, table: true }
      });
    });
  }
}
