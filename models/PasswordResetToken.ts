import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPasswordResetToken extends Document {
  email: string;
  tokenHash: string;
  createdAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// Expire automatically after 15 minutes (900 seconds)
PasswordResetTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

export const PasswordResetToken: Model<IPasswordResetToken> =
  mongoose.models.PasswordResetToken ||
  mongoose.model<IPasswordResetToken>("PasswordResetToken", PasswordResetTokenSchema);
