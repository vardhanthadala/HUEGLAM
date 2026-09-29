import mongoose, { Schema, Document, Model } from "mongoose";

/** Single-document store for site-wide values the admin can edit. */
export interface ISiteSettings extends Document {
  key: string;
  instagramHandle: string;
  instagramUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    key: { type: String, required: true, unique: true, default: "site" },
    instagramHandle: { type: String, default: "@Hueglam_official" },
    instagramUrl: {
      type: String,
      default: "https://www.instagram.com/hueglam_official",
    },
  },
  { timestamps: true }
);

export const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
