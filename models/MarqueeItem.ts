import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMarqueeItem extends Document {
  text: string;
  active: boolean;
  createdAt: Date;
}

const MarqueeItemSchema = new Schema<IMarqueeItem>(
  {
    text: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const MarqueeItem: Model<IMarqueeItem> =
  mongoose.models.MarqueeItem ||
  mongoose.model<IMarqueeItem>("MarqueeItem", MarqueeItemSchema);
