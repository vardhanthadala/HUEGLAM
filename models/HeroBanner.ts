import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * A homepage hero slide. Desktop and mobile artwork are separate because the
 * live design uses 3:1 on desktop and 4:5 on mobile.
 */
export interface IHeroBanner extends Document {
  desktopImage: string;
  mobileImage: string;
  alt: string;
  href: string;
  active: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const HeroBannerSchema = new Schema<IHeroBanner>(
  {
    desktopImage: { type: String, required: true },
    mobileImage: { type: String, default: "" },
    alt: { type: String, default: "" },
    href: { type: String, default: "" },
    active: { type: Boolean, required: true, default: true },
    position: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const HeroBanner: Model<IHeroBanner> =
  mongoose.models.HeroBanner ||
  mongoose.model<IHeroBanner>("HeroBanner", HeroBannerSchema);
