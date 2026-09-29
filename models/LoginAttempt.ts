import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * One document per failed sign-in attempt.
 *
 * Kept in the database rather than in process memory so the lockout survives a
 * restart and holds across every instance — an in-memory counter is no defence
 * at all once the app runs in more than one place, which is the normal case
 * behind a host that scales.
 *
 * The TTL index expires documents automatically, so nothing has to sweep them.
 */

export interface ILoginAttempt extends Document {
  /** Scope + subject, e.g. "admin:email:you@hueglam.com" or "admin:ip:1.2.3.4". */
  key: string;
  createdAt: Date;
}

const LoginAttemptSchema = new Schema<ILoginAttempt>(
  {
    key: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

// Mongo's TTL monitor removes these roughly every minute after they expire.
// The window used for counting is shorter than this, so expiry only ever
// reclaims space — it is never what decides whether an account is locked.
LoginAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

export const LoginAttempt: Model<ILoginAttempt> =
  mongoose.models.LoginAttempt ||
  mongoose.model<ILoginAttempt>("LoginAttempt", LoginAttemptSchema);
