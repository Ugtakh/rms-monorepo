import { Prisma, type OrderStatus, type PaymentStatus } from "@prisma/client";
import { prisma } from "../../../infrastructure/database/postgres/prisma.js";

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

export class OrderRepository {
  static list(tenantId: string, branchId: string) {
    return prisma.order.findMany({
      where: {
        tenantId,
        branchId
      },
      include: {
        items: true,
        payments: true,
        table: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 100
    });
  }

  static create(input: CreateOrderRepositoryInput) {
    return prisma.order.create({
      data: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        tableId: input.tableId,
        createdById: input.createdById,
        orderNo: input.orderNo,
        guestName: input.guestName,
        note: input.note,
        status: input.status,
        paymentStatus: "UNPAID",
        subtotal: new Prisma.Decimal(input.subtotal),
        taxAmount: new Prisma.Decimal(input.taxAmount),
        serviceAmount: new Prisma.Decimal(input.serviceAmount),
        discountAmount: new Prisma.Decimal(input.discountAmount),
        totalAmount: new Prisma.Decimal(input.totalAmount),
        items: {
          createMany: {
            data: input.items.map((item) => ({
              menuItemId: item.menuItemId,
              sku: item.sku,
              itemName: item.itemName,
              quantity: new Prisma.Decimal(item.quantity),
              unitPrice: new Prisma.Decimal(item.unitPrice),
              discount: new Prisma.Decimal(item.discount),
              lineTotal: new Prisma.Decimal(item.lineTotal),
              note: item.note
            }))
          }
        }
      },
      include: {
        items: true,
        table: true,
        payments: true
      }
    });
  }

  static findById(input: { id: string; tenantId: string; branchId: string }) {
    return prisma.order.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
        branchId: input.branchId
      },
      include: {
        items: true,
        payments: true,
        table: true
      }
    });
  }

  static updateStatus(input: {
    id: string;
    tenantId: string;
    branchId: string;
    status: OrderStatus;
    paymentStatus?: PaymentStatus;
  }) {
    return prisma.order.update({
      where: { id: input.id },
      data: {
        status: input.status,
        paymentStatus: input.paymentStatus,
        closedAt: input.status === "CLOSED" ? new Date() : null
      },
      include: {
        items: true,
        payments: true,
        table: true
      }
    });
  }

  static markPaymentStatus(id: string, paymentStatus: PaymentStatus) {
    return prisma.order.update({
      where: { id },
      data: {
        paymentStatus,
        ...(paymentStatus === "PAID" ? { status: "CLOSED", closedAt: new Date() } : {})
      },
      include: {
        items: true,
        payments: true,
        table: true
      }
    });
  }
}
