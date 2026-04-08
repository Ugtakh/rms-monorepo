import { StatusCodes } from "http-status-codes";
import { AppError } from "../../../common/errors/app-error.js";
import { getIo } from "../../../infrastructure/realtime/socket.js";
import { EbarimtService } from "../../ebarimt/services/ebarimt.service.js";
import { PaymentsRepository } from "../repositories/payments.repository.js";

export class PaymentsService {
  static async pay(input: {
    tenantId: string;
    branchId: string;
    orderId: string;
    createdById: string;
    amount: number;
    method: "CASH" | "CARD" | "SOCIALPAY" | "QPAY" | "POCKET" | "BANK_TRANSFER";
    externalRef?: string;
    ebarimt?: {
      customerType: "PERSONAL" | "ORGANIZATION";
      customerName?: string;
      customerTin?: string;
      customerPhone?: string;
    };
    payload?: unknown;
  }) {
    const orderSnapshot = await PaymentsRepository.getOrderSnapshot({
      tenantId: input.tenantId,
      branchId: input.branchId,
      orderId: input.orderId
    });

    if (!orderSnapshot) {
      throw new AppError("Order not found", StatusCodes.NOT_FOUND, "ORDER_NOT_FOUND");
    }

    const ebarimtResult = await EbarimtService.issueFromPayment({
      tenantId: input.tenantId,
      branchId: input.branchId,
      order: orderSnapshot,
      amount: input.amount,
      method: input.method,
      customer: input.ebarimt
    });

    const basePayload =
      input.payload && typeof input.payload === "object" && !Array.isArray(input.payload)
        ? (input.payload as Record<string, unknown>)
        : {};

    const paymentPayload: Record<string, unknown> = {
      ...basePayload,
      ebarimtMeta: ebarimtResult.meta
    };

    if (ebarimtResult.persistedReceipt) {
      paymentPayload.ebarimt = ebarimtResult.persistedReceipt;
    }

    if (ebarimtResult.request) {
      paymentPayload.ebarimtRequest = ebarimtResult.request;
    }

    if (ebarimtResult.response) {
      paymentPayload.ebarimtResponse = {
        id: ebarimtResult.response.id,
        status: ebarimtResult.response.status,
        message: ebarimtResult.response.message,
        date: ebarimtResult.response.date
      };
    }

    const order = await PaymentsRepository.create({
      tenantId: input.tenantId,
      branchId: input.branchId,
      orderId: input.orderId,
      createdById: input.createdById,
      amount: input.amount,
      method: input.method,
      externalRef: input.externalRef,
      payload: paymentPayload
    });

    if (!order) {
      throw new AppError("Order not found", StatusCodes.NOT_FOUND, "ORDER_NOT_FOUND");
    }

    if (ebarimtResult.receipt && order.payments.length > 0) {
      const latestPayment = [...order.payments].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })[0];

      if (latestPayment) {
        const existing =
          latestPayment.payload && typeof latestPayment.payload === "object" && !Array.isArray(latestPayment.payload)
            ? (latestPayment.payload as Record<string, unknown>)
            : {};

        latestPayment.payload = {
          ...existing,
          ebarimt: ebarimtResult.receipt
        };
      }
    }

    getIo().to(`branch:${input.branchId}`).emit("payment.created", {
      orderId: order.id,
      paymentStatus: order.paymentStatus
    });

    return order;
  }
}
