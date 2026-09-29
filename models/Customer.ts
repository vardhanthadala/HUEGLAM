import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomer extends Document {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: "" },
    phone: { type: String },
  },
  { timestamps: true }
);

export const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
