import mongoose, { Schema, Document, Model } from "mongoose";

/** A tile in the "Follow Us on Instagram" rail. */
export interface IInstagramPost extends Document {
  image: string;
  permalink: string;
  caption: string;
  active: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const InstagramPostSchema = new Schema<IInstagramPost>(
  {
    image: { type: String, required: true },
    permalink: { type: String, default: "https://www.instagram.com/hueglam_official" },
    caption: { type: String, default: "" },
    active: { type: Boolean, required: true, default: true },
    position: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const InstagramPost: Model<IInstagramPost> =
  mongoose.models.InstagramPost ||
  mongoose.model<IInstagramPost>("InstagramPost", InstagramPostSchema);
