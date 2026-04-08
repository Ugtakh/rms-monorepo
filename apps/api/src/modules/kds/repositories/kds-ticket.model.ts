import mongoose, { type Model, Schema, model } from "mongoose";

export interface KdsTicketItem {
  menuItemId: string;
  itemName: string;
  quantity: number;
  note?: string | null;
}

export interface KdsTicket {
  tenantId: string;
  branchId: string;
  orderId: string;
  orderNo: string;
  status: string;
  station: string;
  items: KdsTicketItem[];
  createdAt: Date;
  updatedAt: Date;
}

const kdsTicketSchema = new Schema<KdsTicket>(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: String, required: true, index: true },
    orderId: { type: String, required: true, index: true },
    orderNo: { type: String, required: true },
    status: { type: String, required: true },
    station: { type: String, default: "main" },
    items: {
      type: [
        {
          menuItemId: String,
          itemName: String,
          quantity: Number,
          note: String
        }
      ],
      default: []
    }
  },
  { timestamps: true, collection: "kds_tickets" }
);

kdsTicketSchema.index({ tenantId: 1, branchId: 1, orderId: 1 }, { unique: true });

export const KdsTicketModel =
  (mongoose.models.KdsTicket as Model<KdsTicket> | undefined) ??
  model<KdsTicket>("KdsTicket", kdsTicketSchema);
