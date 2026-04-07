import { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../infrastructure/database/postgres/prisma.js";
import type { OrderPaymentSnapshot } from "../../ebarimt/services/ebarimt.service.js";

type PaymentMethod =
  | "CASH"
  | "CARD"
  | "SOCIALPAY"
  | "QPAY"
  | "POCKET"
  | "BANK_TRANSFER";

function safeNumber(value: Prisma.Decimal | number): number {
  return Number(value);
}

export class PaymentsRepository {
  static async getOrderSnapshot(input: {
    tenantId: string;
    branchId: string;
    orderId: string;
  }): Promise<OrderPaymentSnapshot | null> {
    const order = await prisma.order.findFirst({
      where: {
        id: input.orderId,
        tenantId: input.tenantId,
        branchId: input.branchId
      },
      include: {
        items: true,
        payments: true
      }
    });

    if (!order) {
      return null;
    }

    return {
      id: order.id,
      orderNo: order.orderNo,
      subtotal: safeNumber(order.subtotal),
      taxAmount: safeNumber(order.taxAmount),
      serviceAmount: safeNumber(order.serviceAmount),
      totalAmount: safeNumber(order.totalAmount),
      items: order.items.map((item) => ({
        itemName: item.itemName,
        quantity: safeNumber(item.quantity),
        unitPrice: safeNumber(item.unitPrice),
        lineTotal: safeNumber(item.lineTotal),
        sku: item.sku
      })),
      payments: order.payments.map((payment) => ({
        amount: safeNumber(payment.amount),
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
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: input.orderId,
          tenantId: input.tenantId,
          branchId: input.branchId
        },
        include: {
          payments: true
        }
      });

      if (!order) {
        return null;
      }

      const basePayload =
        input.payload && typeof input.payload === "object" && !Array.isArray(input.payload)
          ? (input.payload as Prisma.JsonObject)
          : {};

      await tx.payment.create({
        data: {
          tenantId: input.tenantId,
          branchId: input.branchId,
          orderId: order.id,
          createdById: input.createdById,
          amount: new Prisma.Decimal(input.amount),
          method: input.method,
          status: PaymentStatus.PAID,
          externalRef: input.externalRef,
          payload: basePayload
        }
      });

      const totalPaid = order.payments.reduce((acc, item) => acc + Number(item.amount), 0) + input.amount;
      const totalAmount = Number(order.totalAmount);

      const paymentStatus =
        totalPaid >= totalAmount ? PaymentStatus.PAID : totalPaid > 0 ? PaymentStatus.PARTIAL : PaymentStatus.UNPAID;

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus,
          ...(paymentStatus === PaymentStatus.PAID ? { status: "CLOSED", closedAt: new Date() } : {})
        },
        include: {
          items: true,
          payments: true,
          table: true
        }
      });

      return updatedOrder;
    });
  }
}
