import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrder extends Document {
  customer: {
    name: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  lines: Array<{
    productId: string;
    quantity: number;
  }>;
  customerNote?: string;
  couponCode?: string;
  billingAddress?: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  status: 'pending_payment' | 'paid' | 'failed' | 'processing' | 'shipped' | 'delivered';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    lines: [
      {
        productId: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    customerNote: { type: String },
    couponCode: { type: String },
    billingAddress: {
      name: { type: String },
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      phone: { type: String },
    },
    status: { 
      type: String, 
      enum: ['pending_payment', 'paid', 'failed', 'processing', 'shipped', 'delivered'],
      default: 'pending_payment'
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
  },
  {
    timestamps: true,
  }
);

// Prevent mongoose from compiling the model multiple times in development
export const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
