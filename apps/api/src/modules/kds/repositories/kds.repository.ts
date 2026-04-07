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
}
