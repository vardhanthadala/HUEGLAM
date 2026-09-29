import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  handle: string;
  title: string;
  vendor: string;
  description: string;
  bodyHtml: string;
  /** Structured PDP content, edited as separate fields in the admin. */
  activeIngredients: string;
  benefits: string[];
  ingredients: string;
  directions: string;
  careGuide: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  grams: number;
  tags: string[];
  inventory: number;
  trackInventory: boolean;
  available: boolean;
  published: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  // Let's embed product images directly since MongoDB supports documents!
  images: Array<{
    src: string;
    alt: string;
    width: number;
    height: number;
    position: number;
  }>;
}

const ProductSchema = new Schema<IProduct>(
  {
    handle: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    vendor: { type: String, required: true, default: "HUEGLAM" },
    description: { type: String, default: "" },
    bodyHtml: { type: String, default: "" },
    activeIngredients: { type: String, default: "" },
    benefits: { type: [String], default: [] },
    ingredients: { type: String, default: "" },
    directions: { type: String, default: "" },
    careGuide: { type: String, default: "" },
    sku: { type: String },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    grams: { type: Number, required: true, default: 0 },
    tags: { type: [String], default: [] },
    inventory: { type: Number, required: true, default: 0 },
    trackInventory: { type: Boolean, required: true, default: true },
    available: { type: Boolean, required: true, default: true },
    published: { type: Boolean, required: true, default: true },
    position: { type: Number, required: true, default: 0 },
    images: [
      {
        src: { type: String, required: true },
        alt: { type: String, default: "" },
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
        position: { type: Number, default: 1 },
      },
    ],
  },
  { timestamps: true }
);

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
