import { KdsTicketModel } from "./kds-ticket.model.js";

export class KdsRepository {
  static list(input: {
    tenantId: string;
    branchId: string;
    status?: string;
    station?: string;
  }) {
    return KdsTicketModel.find({
      tenantId: input.tenantId,
      branchId: input.branchId,
      ...(input.status ? { status: input.status } : {}),
      ...(input.station ? { station: input.station } : {})
    })
      .sort({ createdAt: 1 })
      .lean();
  }

  static updateStatus(input: { tenantId: string; branchId: string; id: string; status: string }) {
    return KdsTicketModel.findOneAndUpdate(
      {
        _id: input.id,
        tenantId: input.tenantId,
        branchId: input.branchId
      },
      {
        $set: {
          status: input.status
        }
      },
      { new: true }
    ).lean();
  }

  static upsertForOrder(input: {
    tenantId: string;
    branchId: string;
    orderId: string;
    orderNo: string;
    status: string;
    station: string;
    items: Array<{
      menuItemId: string;
      itemName: string;
      quantity: number;
      note?: string | null;
    }>;
  }) {
    const filter = {
      tenantId: input.tenantId,
      branchId: input.branchId,
      orderId: input.orderId
    };
    const update = {
      $set: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        orderId: input.orderId,
        orderNo: input.orderNo,
        status: input.status,
        station: input.station,
        items: input.items
      }
    };

    return KdsTicketModel.findOneAndUpdate(filter as any, update as any, {
      upsert: true,
      new: true
    }).lean();
  }

  static updateStatusByOrder(input: {
    tenantId: string;
    branchId: string;
    orderId: string;
    status: string;
  }) {
    const filter = {
      tenantId: input.tenantId,
      branchId: input.branchId,
      orderId: input.orderId
    };
    const update = {
      $set: {
        status: input.status
      }
    };

    return KdsTicketModel.findOneAndUpdate(filter as any, update as any, { new: true }).lean();
  }
}
