import mongoose, { Schema, Document, Model } from "mongoose";

/** A shoppable video reel on the homepage. */
export interface IReel extends Document {
  video: string;
  videoType: string;
  poster: string;
  /** Handle of the product this reel promotes. */
  productHandle: string;
  alt: string;
  active: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReelSchema = new Schema<IReel>(
  {
    video: { type: String, required: true },
    videoType: { type: String, default: "video/mp4" },
    poster: { type: String, default: "" },
    productHandle: { type: String, default: "" },
    alt: { type: String, default: "" },
    active: { type: Boolean, required: true, default: true },
    position: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const Reel: Model<IReel> =
  mongoose.models.Reel || mongoose.model<IReel>("Reel", ReelSchema);
