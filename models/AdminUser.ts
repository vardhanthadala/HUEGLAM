import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdminUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: "Admin" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AdminUser: Model<IAdminUser> =
  mongoose.models.AdminUser || mongoose.model<IAdminUser>("AdminUser", AdminUserSchema);
