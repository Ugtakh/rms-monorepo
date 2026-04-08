import { eq, and, gte, lte, ne, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/postgres/db.js";
import { orders, payments } from "../../../infrastructure/database/postgres/schema.js";

export class ReportsRepository {
  static async salesSummary(input: {
    tenantId: string;
    branchId?: string;
    start: Date;
    end: Date;
  }) {
    const baseOrderWhere = and(
      eq(orders.tenantId, input.tenantId),
      input.branchId ? eq(orders.branchId, input.branchId) : undefined,
      gte(orders.createdAt, input.start),
      lte(orders.createdAt, input.end),
      ne(orders.status, "CANCELLED")
    );

    const basePaymentWhere = and(
      eq(payments.tenantId, input.tenantId),
      input.branchId ? eq(payments.branchId, input.branchId) : undefined,
      gte(payments.createdAt, input.start),
      lte(payments.createdAt, input.end),
      eq(payments.status, "PAID")
    );

    const [aggregate, byBranch, byPaymentMethod] = await Promise.all([
      db
        .select({
          orderCount: sql<number>`count(${orders.id})::int`,
          subtotal: sql<number>`coalesce(sum(${orders.subtotal}), 0)::float`,
          taxAmount: sql<number>`coalesce(sum(${orders.taxAmount}), 0)::float`,
          serviceAmount: sql<number>`coalesce(sum(${orders.serviceAmount}), 0)::float`,
          totalAmount: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::float`
        })
        .from(orders)
        .where(baseOrderWhere),

      db
        .select({
          branchId: orders.branchId,
          orderCount: sql<number>`count(${orders.id})::int`,
          totalAmount: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::float`
        })
        .from(orders)
        .where(baseOrderWhere)
        .groupBy(orders.branchId),

      db
        .select({
          method: payments.method,
          count: sql<number>`count(${payments.id})::int`,
          amount: sql<number>`coalesce(sum(${payments.amount}), 0)::float`
        })
        .from(payments)
        .where(basePaymentWhere)
        .groupBy(payments.method)
    ]);

    return {
      totals: aggregate[0] ?? {
        orderCount: 0,
        subtotal: 0,
        taxAmount: 0,
        serviceAmount: 0,
        totalAmount: 0
      },
      byBranch: byBranch.map((item) => ({
        branchId: item.branchId,
        orderCount: item.orderCount,
        totalAmount: item.totalAmount
      })),
      byPaymentMethod: byPaymentMethod.map((item) => ({
        method: item.method,
        count: item.count,
        amount: item.amount
      }))
    };
  }
}
