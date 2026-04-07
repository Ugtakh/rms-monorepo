import { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../infrastructure/database/postgres/prisma.js";

export class ReportsRepository {
  static async salesSummary(input: {
    tenantId: string;
    branchId?: string;
    start: Date;
    end: Date;
  }) {
    const orderWhere: Prisma.OrderWhereInput = {
      tenantId: input.tenantId,
      ...(input.branchId ? { branchId: input.branchId } : {}),
      createdAt: {
        gte: input.start,
        lte: input.end
      },
      status: {
        notIn: ["CANCELLED"]
      }
    };

    const paymentWhere: Prisma.PaymentWhereInput = {
      tenantId: input.tenantId,
      ...(input.branchId ? { branchId: input.branchId } : {}),
      createdAt: {
        gte: input.start,
        lte: input.end
      },
      status: PaymentStatus.PAID
    };

    const [ordersAggregate, byBranch, byPaymentMethod] = await Promise.all([
      prisma.order.aggregate({
        where: orderWhere,
        _count: { id: true },
        _sum: { subtotal: true, taxAmount: true, serviceAmount: true, totalAmount: true }
      }),
      prisma.order.groupBy({
        by: ["branchId"],
        where: orderWhere,
        _count: { id: true },
        _sum: { totalAmount: true }
      }),
      prisma.payment.groupBy({
        by: ["method"],
        where: paymentWhere,
        _count: { id: true },
        _sum: { amount: true }
      })
    ]);

    return {
      totals: {
        orderCount: ordersAggregate._count.id,
        subtotal: Number(ordersAggregate._sum.subtotal ?? 0),
        taxAmount: Number(ordersAggregate._sum.taxAmount ?? 0),
        serviceAmount: Number(ordersAggregate._sum.serviceAmount ?? 0),
        totalAmount: Number(ordersAggregate._sum.totalAmount ?? 0)
      },
      byBranch: byBranch.map((item) => ({
        branchId: item.branchId,
        orderCount: item._count.id,
        totalAmount: Number(item._sum.totalAmount ?? 0)
      })),
      byPaymentMethod: byPaymentMethod.map((item) => ({
        method: item.method,
        count: item._count.id,
        amount: Number(item._sum.amount ?? 0)
      }))
    };
  }
}
