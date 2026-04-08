import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const kdsTicketSchema = new Schema(
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

type KdsTicket = InferSchemaType<typeof kdsTicketSchema>;

export const KdsTicketModel =
  mongoose.models.KdsTicket || model<KdsTicket>("KdsTicket", kdsTicketSchema);
