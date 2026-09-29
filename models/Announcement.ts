import mongoose, { Schema, Document, Model } from "mongoose";

/** A message in the black broadcast bar above the header. */
export interface IAnnouncement extends Document {
  text: string;
  ctaLabel: string;
  ctaHref: string;
  active: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    text: { type: String, required: true },
    ctaLabel: { type: String, default: "" },
    ctaHref: { type: String, default: "/collections/all" },
    active: { type: Boolean, required: true, default: true },
    position: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const Announcement: Model<IAnnouncement> =
  mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);
