/**
 * The shapes the app passes around, independent of the database driver.
 *
 * Declared here rather than inferred from the Mongoose models, so a page that
 * renders a product depends on a shape and not on the database layer. All money
 * is integer paise.
 */

export type ProductImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  position: number;
};

export type ProductWithImages = {
  /** Mongo _id as a hex string. */
  id: string;
  handle: string;
  title: string;
  vendor: string;
  description: string;
  bodyHtml: string;
  /** Structured PDP accordion content, edited per-field in the admin. */
  activeIngredients: string;
  benefits: string[];
  ingredients: string;
  directions: string;
  careGuide: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  grams: number;
  tags: string[];
  inventory: number;
  trackInventory: boolean;
  available: boolean;
  published: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  images: ProductImage[];
};

export type StoreOrderItem = {
  id: string;
  productId: string | null;
  title: string;
  handle: string;
  sku: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type StoreAddress = {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
};

export type StoreOrder = {
  id: string;
  orderNumber: string;
  email: string;
  customerName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode: string | null;
  customerNote: string | null;
  /** Only set when the customer chose a billing address of their own. */
  billingAddress: StoreAddress | null;
  status: string;
  paymentMethod: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: StoreOrderItem[];
};
