import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * A placed order.
 *
 * Every line carries a snapshot of the product as it was sold — title, price,
 * image — rather than only a reference. Prices and titles change; an invoice
 * must not. All money is integer paise.
 */

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
  "failed",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface IOrderItem {
  /** Assigned by Mongo; used as the React key when rendering an order. */
  _id?: mongoose.Types.ObjectId;
  /** Product _id as a hex string, or null if the product was later deleted. */
  productId: string | null;
  title: string;
  handle: string;
  sku: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface IAddress {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  /** Always the signed-in account's email: this is how order history matches. */
  email: string;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string | null;
  customerNote?: string | null;
  billingAddress?: IAddress | null;
  status: OrderStatus;
  paymentMethod: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  trackingCarrier?: string | null;
  trackingNumber?: string | null;
  notes?: string | null;
  cancelledAt?: Date | null;
  cancelReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, default: null },
    title: { type: String, required: true },
    handle: { type: String, required: true },
    sku: { type: String, default: null },
    image: { type: String, default: null },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: true },
);

const AddressSchema = new Schema<IAddress>(
  {
    name: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, default: "" },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },

    items: { type: [OrderItemSchema], required: true },

    subtotal: { type: Number, required: true },
    discount: { type: Number, required: true, default: 0 },
    shipping: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },

    couponCode: { type: String, default: null },
    customerNote: { type: String, default: null },
    billingAddress: { type: AddressSchema, default: null },

    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },
    paymentMethod: { type: String, default: "razorpay" },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },

    trackingCarrier: { type: String, default: null },
    trackingNumber: { type: String, default: null },
    notes: { type: String, default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: null },
  },
  { timestamps: true },
);

// Order history is always "this customer's orders, newest first".
OrderSchema.index({ email: 1, createdAt: -1 });

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
