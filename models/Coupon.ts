import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal: number;
  active: boolean;
  usageLimit?: number;
  usageCount: number;
  expiresAt?: Date;
  createdAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ["percent", "fixed"], default: "percent" },
    value: { type: Number, required: true },
    minSubtotal: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    usageLimit: { type: Number },
    usageCount: { type: Number, default: 0 },
    expiresAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);
