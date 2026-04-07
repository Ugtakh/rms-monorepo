import { StatusCodes } from "http-status-codes";
import { AppError } from "../../../common/errors/app-error.js";
import { getIo } from "../../../infrastructure/realtime/socket.js";
import { OrdersService } from "../../orders/services/orders.service.js";
import { KdsRepository } from "../repositories/kds.repository.js";

const mapKdsToOrderStatus: Record<string, "IN_PROGRESS" | "READY" | "SERVED"> = {
  IN_PROGRESS: "IN_PROGRESS",
  READY: "READY",
  SERVED: "SERVED"
};

export class KdsService {
  static async list(input: { tenantId: string; branchId: string; status?: string; station?: string }) {
    return KdsRepository.list(input);
  }

  static async updateStatus(input: {
    tenantId: string;
    branchId: string;
    id: string;
    status: "IN_PROGRESS" | "READY" | "SERVED";
  }) {
    const ticket = await KdsRepository.updateStatus(input);

    if (!ticket) {
      throw new AppError("KDS ticket not found", StatusCodes.NOT_FOUND, "KDS_TICKET_NOT_FOUND");
    }

    await OrdersService.updateStatus({
      id: String(ticket.orderId),
      tenantId: input.tenantId,
      branchId: input.branchId,
      status: mapKdsToOrderStatus[input.status]
    });

    getIo().to(`branch:${input.branchId}`).emit("kds.ticket.updated", {
      id: ticket._id,
      status: ticket.status,
      orderId: ticket.orderId
    });

    return ticket;
  }
}
