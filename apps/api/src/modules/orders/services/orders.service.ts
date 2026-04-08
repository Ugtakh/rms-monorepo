import dayjs from "dayjs";
import { nanoid } from "nanoid";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../../common/errors/app-error.js";
import { getIo } from "../../../infrastructure/realtime/socket.js";
import { KdsTicketModel } from "../../kds/repositories/kds-ticket.model.js";
import {
  OrderRepository,
  type CreateOrderRepositoryInput
} from "../repositories/order.repository.js";

const TAX_RATE = 0.1;
const SERVICE_RATE = 0.05;

export class OrdersService {
  static async list(tenantId: string, branchId: string) {
    return OrderRepository.list(tenantId, branchId);
  }

  static async create(input: {
    tenantId: string;
    branchId: string;
    createdById: string;
    tableId: string | null;
    guestName?: string;
    note?: string;
    sendToKitchen: boolean;
    items: Array<{
      menuItemId: string;
      sku?: string;
      itemName: string;
      quantity: number;
      unitPrice: number;
      discount?: number;
      note?: string;
    }>;
  }) {
    if (input.items.length === 0) {
      throw new AppError("Order items are required", StatusCodes.BAD_REQUEST, "ORDER_ITEMS_REQUIRED");
    }

    const mappedItems = input.items.map((item) => {
      const discount = item.discount ?? 0;
      const lineTotal = item.quantity * item.unitPrice - discount;

      return {
        ...item,
        discount,
        lineTotal
      };
    });

    const subtotal = mappedItems.reduce((acc, item) => acc + item.lineTotal, 0);
    const taxAmount = subtotal * TAX_RATE;
    const serviceAmount = subtotal * SERVICE_RATE;
    const discountAmount = mappedItems.reduce((acc, item) => acc + item.discount, 0);
    const totalAmount = subtotal + taxAmount + serviceAmount;

    const payload: CreateOrderRepositoryInput = {
      tenantId: input.tenantId,
      branchId: input.branchId,
      tableId: input.tableId,
      createdById: input.createdById,
      orderNo: `ORD-${dayjs().format("YYYYMMDD")}-${nanoid(6).toUpperCase()}`,
      guestName: input.guestName,
      note: input.note,
      status: input.sendToKitchen ? "SUBMITTED" : "DRAFT",
      subtotal,
      taxAmount,
      serviceAmount,
      discountAmount,
      totalAmount,
      items: mappedItems
    };

    const order = await OrderRepository.create(payload);

    if (input.sendToKitchen) {
      await KdsTicketModel.findOneAndUpdate(
        {
          tenantId: input.tenantId,
          branchId: input.branchId,
          orderId: order?.id
        },
        {
          $set: {
            tenantId: input.tenantId,
            branchId: input.branchId,
            orderId: order?.id,
            orderNo: order?.orderNo,
            status: order?.status,
            station: "main",
            items: order?.items.map((item) => ({
              menuItemId: item.menuItemId,
              itemName: item.itemName,
              quantity: Number(item.quantity),
              note: item.note
            }))
          }
        },
        { upsert: true, new: true }
      );
    }

    const io = getIo();
    io.to(`branch:${input.branchId}`).emit("order.created", {
      order
    });

    if (input.sendToKitchen) {
      io.to(`branch:${input.branchId}`).emit("kds.ticket.created", {
        orderId: order?.id,
        orderNo: order?.orderNo
      });
    }

    return order;
  }

  static async updateStatus(input: {
    id: string;
    tenantId: string;
    branchId: string;
    status: "DRAFT" | "SUBMITTED" | "IN_PROGRESS" | "READY" | "SERVED" | "CLOSED" | "CANCELLED";
  }) {
    const order = await OrderRepository.findById({
      id: input.id,
      tenantId: input.tenantId,
      branchId: input.branchId
    });

    if (!order) {
      throw new AppError("Order not found", StatusCodes.NOT_FOUND, "ORDER_NOT_FOUND");
    }

    const updated = await OrderRepository.updateStatus({
      id: order.id,
      tenantId: input.tenantId,
      branchId: input.branchId,
      status: input.status
    });

    await KdsTicketModel.findOneAndUpdate(
      { tenantId: input.tenantId, branchId: input.branchId, orderId: updated?.id },
      {
        $set: {
          status: updated?.status
        }
      },
      { new: true }
    );

    getIo().to(`branch:${input.branchId}`).emit("order.status.updated", {
      orderId: updated?.id,
      status: updated?.status
    });

    return updated;
  }
}
