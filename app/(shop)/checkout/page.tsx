"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { AuthModal } from "@/components/AuthModal";
import { formatINR } from "@/lib/money";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const EMPTY_FORM = {
  email: "",
  firstName: "",
  lastName: "",
  address: "",
  apartment: "",
  city: "",
  state: "Telangana",
  pincode: "",
  phone: "",
};

const EMPTY_BILLING = {
  firstName: "",
  lastName: "",
  address: "",
  apartment: "",
  city: "",
  state: "Telangana",
  pincode: "",
  phone: "",
};

/** Shopify-style floating label field. */
function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  inputMode,
  maxLength,
  pattern,
  autoComplete,
  className = "",
  adornment,
  readOnly = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  inputMode?: "text" | "numeric" | "tel" | "email";
  maxLength?: number;
  pattern?: string;
  autoComplete?: string;
  className?: string;
  adornment?: React.ReactNode;
  readOnly?: boolean;
}) {
  return (
    <div className={"relative " + className}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        inputMode={inputMode}
        maxLength={maxLength}
        pattern={pattern}
        autoComplete={autoComplete}
        readOnly={readOnly}
        placeholder=" "
        className={
          "peer h-14 w-full rounded-lg border border-[#d9d9d9] pt-5 pb-1.5 pl-3.5 text-[0.9375rem] text-ink outline-none transition-colors focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] " +
          (readOnly ? "bg-[#f7f7f7] text-ink-soft " : "bg-white ") +
          (adornment ? "pr-24" : "pr-3.5")
        }
      />
      {adornment && (
        <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2 text-ink-soft">
          {adornment}
        </span>
      )}
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3.5 top-1.5 text-[0.6875rem] text-ink-soft transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-[0.9375rem] peer-focus:top-1.5 peer-focus:text-[0.6875rem]"
      >
        {label}
      </label>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, note, subtotal, ready, clear } = useCart();
  const [form, setForm] = useState(EMPTY_FORM);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState(EMPTY_BILLING);
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [smsPhone, setSmsPhone] = useState("");
  const [saveInfo, setSaveInfo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    void loadRazorpay();
  }, []);

  // Prefill from the signed-in account. The email is then locked: orders are
  // matched back to an account by email, so letting it differ here would leave
  // the order invisible in the customer's own order history.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/account/me");
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled || !data.customer) return;

        const parts = String(data.customer.name ?? "").trim().split(/\s+/);
        setForm((f) => ({
          ...f,
          email: data.customer.email,
          firstName: f.firstName || (parts[0] ?? ""),
          lastName: f.lastName || parts.slice(1).join(" "),
        }));
      } catch {
        // Prefill is a convenience; checkout still works without it.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function update(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateBilling(field: keyof typeof EMPTY_BILLING, value: string) {
    setBilling((b) => ({ ...b, [field]: value }));
  }

  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const created = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: (form.firstName + " " + form.lastName).trim(),
            email: form.email,
            phone: form.phone,
            addressLine1: form.address,
            addressLine2: form.apartment,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
          lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
          customerNote: note || undefined,
          couponCode: appliedCode || undefined,
          billingAddress: billingSame
            ? undefined
            : {
                name: (billing.firstName + " " + billing.lastName).trim(),
                addressLine1: billing.address,
                addressLine2: billing.apartment,
                city: billing.city,
                state: billing.state,
                pincode: billing.pincode,
                phone: billing.phone,
              },
        }),
      });

      const data = await created.json();
      if (!created.ok) throw new Error(data.error ?? "Could not start checkout.");

      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        throw new Error("Could not reach the payment gateway. Check your connection.");
      }

      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "HUEGLAM",
        description: "Order " + data.orderNumber,
        order_id: data.razorpayOrderId,
        prefill: {
          name: (form.firstName + " " + form.lastName).trim(),
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#212529" },
        handler: (response) => {
          void (async () => {
            const verified = await fetch("/api/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const result = await verified.json();
            if (!verified.ok) {
              setError(result.error ?? "Payment could not be verified.");
              setBusy(false);
              return;
            }
            clear();
            router.push("/order/" + result.orderNumber);
          })();
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setError("Payment was cancelled. Your cart has been kept.");
          },
        },
      });

      checkout.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  if (!ready) {
    return <div className="min-h-dvh" aria-busy="true" />;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-gutter py-28 text-center">
        <h1 className="text-2xl font-light tracking-tight">Nothing to check out</h1>
        <Link
          href="/collections/all"
          className="bg-ink px-8 py-3.5 text-[0.6875rem] font-medium tracking-[0.16em] uppercase text-white"
        >
          Shop skincare
        </Link>
      </div>
    );
  }

  const heading = "text-[1.375rem] text-ink";
  const checkboxRow = "flex items-center gap-3 text-[0.875rem] text-ink";

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-2">
      {/* Left: form */}
      <div className="lg:flex lg:justify-end relative z-10">
        <form
          onSubmit={handleSubmit}
          className="w-full px-gutter py-10 lg:max-w-[560px] lg:px-12"
        >
          <fieldset disabled={busy} className="contents">
            {/* Contact */}
            <div className="flex items-center justify-between">
              <h2 className={heading}>Contact</h2>
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="text-[0.875rem] text-[#1a73e8] underline underline-offset-4"
              >
                Sign in
              </button>
            </div>

            <div className="mt-4">
              <Field
                id="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => update("email", v)}
                autoComplete="email"
                readOnly
                required
              />
            </div>

            <label className={checkboxRow + " mt-4"}>
              <input
                type="checkbox"
                checked={emailOptIn}
                onChange={(e) => setEmailOptIn(e.target.checked)}
                className="size-[18px] accent-[#1a73e8]"
              />
              Email me with news and offers
            </label>

            {/* Delivery */}
            <h2 className={heading + " mt-10"}>Delivery</h2>

            <div className="mt-4 flex flex-col gap-3">
              <div className="relative">
                <select
                  disabled
                  className="h-14 w-full appearance-none rounded-lg border border-[#d9d9d9] bg-white px-3.5 pt-5 pb-1.5 text-[0.9375rem] text-ink"
                >
                  <option>India</option>
                </select>
                <span className="pointer-events-none absolute left-3.5 top-1.5 text-[0.6875rem] text-ink-soft">
                  Country/Region
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  id="firstName"
                  label="First name (optional)"
                  value={form.firstName}
                  onChange={(v) => update("firstName", v)}
                  autoComplete="given-name"
                />
                <Field
                  id="lastName"
                  label="Last name"
                  value={form.lastName}
                  onChange={(v) => update("lastName", v)}
                  autoComplete="family-name"
                  required
                />
              </div>

              <Field
                id="address"
                label="Address"
                value={form.address}
                onChange={(v) => update("address", v)}
                autoComplete="address-line1"
                required
                adornment={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                  </svg>
                }
              />
              <Field
                id="apartment"
                label="Apartment, suite, etc. (optional)"
                value={form.apartment}
                onChange={(v) => update("apartment", v)}
                autoComplete="address-line2"
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <Field
                  id="city"
                  label="City"
                  value={form.city}
                  onChange={(v) => update("city", v)}
                  autoComplete="address-level2"
                  required
                />
                <div className="relative">
                  <select
                    id="state"
                    value={form.state}
                    onChange={(e) => update("state", e.target.value)}
                    className="h-14 w-full appearance-none rounded-lg border border-[#d9d9d9] bg-white px-3.5 pt-5 pb-1.5 text-[0.9375rem] text-ink outline-none focus:border-[#1a73e8]"
                  >
                    {STATES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <label
                    htmlFor="state"
                    className="pointer-events-none absolute left-3.5 top-1.5 text-[0.6875rem] text-ink-soft"
                  >
                    State
                  </label>
                </div>
                <Field
                  id="pincode"
                  label="PIN code"
                  value={form.pincode}
                  onChange={(v) => update("pincode", v.replace(/\D/g, ""))}
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[1-9][0-9]{5}"
                  autoComplete="postal-code"
                  required
                />
              </div>

              <Field
                id="phone"
                label="Phone"
                value={form.phone}
                onChange={(v) => update("phone", v.replace(/\D/g, ""))}
                inputMode="tel"
                maxLength={10}
                pattern="[0-9]{10}"
                autoComplete="tel-national"
                required
                adornment={
                  <>
                    <span
                      title="We use this to send delivery updates about your order."
                      aria-hidden
                      className="flex size-[18px] items-center justify-center rounded-full border border-current text-[0.625rem]"
                    >
                      ?
                    </span>
                    <span className="text-[0.8125rem]">+91</span>
                  </>
                }
              />
            </div>

            <label className={checkboxRow + " mt-4"}>
              <input
                type="checkbox"
                checked={saveInfo}
                onChange={(e) => setSaveInfo(e.target.checked)}
                className="size-[18px] accent-[#1a73e8]"
              />
              Save this information for next time
            </label>
            <label className={checkboxRow + " mt-3"}>
              <input
                type="checkbox"
                checked={smsOptIn}
                onChange={(e) => setSmsOptIn(e.target.checked)}
                className="size-[18px] accent-[#1a73e8]"
              />
              Text me with news and offers
            </label>

            {smsOptIn && (
              <div className="mt-4">
                <Field
                  id="smsPhone"
                  label="Mobile phone number"
                  value={smsPhone}
                  onChange={(v) => setSmsPhone(v.replace(/\D/g, ""))}
                  inputMode="tel"
                  maxLength={10}
                  autoComplete="tel-national"
                  adornment={<span className="text-[0.8125rem]">+91</span>}
                />
                <p className="mt-3 text-[0.75rem] leading-[1.6] text-ink-soft">
                  By opting in you agree to receive recurring automated marketing
                  messages, including cart reminders, at the number provided.
                  Consent is not a condition of purchase. Reply STOP to
                  unsubscribe or HELP for help. Message frequency varies, and
                  message and data rates may apply. See our{" "}
                  <Link href="/pages/privacy-policy" className="underline underline-offset-4">
                    Privacy policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/pages/terms-of-service" className="underline underline-offset-4">
                    Terms of service
                  </Link>
                  .
                </p>
              </div>
            )}

            {/* Shipping method */}
            <h2 className={heading + " mt-10"}>Shipping method</h2>
            {form.pincode.length === 6 ? (
              <div className="mt-4 flex items-center justify-between rounded-lg border-2 border-[#1a73e8] bg-[#f0f6ff] px-4 py-4 text-[0.875rem] text-ink">
                <span>Standard</span>
                <span className="font-medium">
                  {subtotal >= 99900 ? "FREE" : formatINR(4900)}
                </span>
              </div>
            ) : (
              <div className="mt-4 rounded-lg bg-[#f2f2f2] px-4 py-5 text-[0.875rem] text-ink-soft">
                Enter your shipping address to view available shipping methods.
              </div>
            )}

            {/* Payment */}
            <h2 className={heading + " mt-10"}>Payment</h2>
            <p className="mt-1 text-[0.8125rem] text-ink-soft">
              All transactions are secure and encrypted.
            </p>

            <div className="mt-4 rounded-lg border-2 border-[#1a73e8]">
              <div className="flex flex-col gap-3 rounded-t-[6px] bg-[#f0f6ff] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[0.875rem] font-medium text-ink">
                  Razorpay Secure (UPI, Card, Int&apos;l Card, Apple Pay)
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <img src="/payment-logos/user_upi.png" alt="UPI" className="h-7 w-11 object-contain" />
                  <img src="/payment-logos/user_visa.png" alt="Visa" className="h-7 w-11 object-contain" />
                  <img src="/payment-logos/user_mastercard.png" alt="Mastercard" className="h-7 w-11 object-contain" />

                </div>
              </div>
              <p className="rounded-b-[6px] bg-[#f2f2f2] px-4 py-5 text-center text-[0.8125rem] text-ink-soft">
                You&apos;ll be redirected to Razorpay Secure (UPI, Card, Int&apos;l Card, Apple Pay) to complete your purchase
              </p>
            </div>

            {/* Billing address */}
            <h2 className={heading + " mt-10"}>Billing address</h2>
            <div className="mt-4 overflow-hidden rounded-lg border border-[#d9d9d9]">
              <label
                className={
                  "flex items-center gap-3 border-b border-[#d9d9d9] px-4 py-4 text-[0.875rem] " +
                  (billingSame ? "bg-[#f0f6ff]" : "")
                }
              >
                <input
                  type="radio"
                  name="billing"
                  checked={billingSame}
                  onChange={() => setBillingSame(true)}
                  className="size-[18px] accent-[#1a73e8]"
                />
                Same as shipping address
              </label>
              <label
                className={
                  "flex items-center gap-3 px-4 py-4 text-[0.875rem] " +
                  (billingSame ? "" : "bg-[#f0f6ff]")
                }
              >
                <input
                  type="radio"
                  name="billing"
                  checked={!billingSame}
                  onChange={() => setBillingSame(false)}
                  className="size-[18px] accent-[#1a73e8]"
                />
                Use a different billing address
              </label>
            </div>

            {!billingSame && (
              <div className="mt-3 flex flex-col gap-3 rounded-lg bg-[#f2f2f2] p-4">
                <div className="relative">
                  <select
                    disabled
                    className="h-14 w-full appearance-none rounded-lg border border-[#d9d9d9] bg-white px-3.5 pt-5 pb-1.5 text-[0.9375rem] text-ink"
                  >
                    <option>India</option>
                  </select>
                  <span className="pointer-events-none absolute left-3.5 top-1.5 text-[0.6875rem] text-ink-soft">
                    Country/Region
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    id="billingFirstName"
                    label="First name (optional)"
                    value={billing.firstName}
                    onChange={(v) => updateBilling("firstName", v)}
                    autoComplete="billing given-name"
                  />
                  <Field
                    id="billingLastName"
                    label="Last name"
                    value={billing.lastName}
                    onChange={(v) => updateBilling("lastName", v)}
                    autoComplete="billing family-name"
                    required
                  />
                </div>

                <Field
                  id="billingAddress"
                  label="Address"
                  value={billing.address}
                  onChange={(v) => updateBilling("address", v)}
                  autoComplete="billing address-line1"
                  required
                />
                <Field
                  id="billingApartment"
                  label="Apartment, suite, etc. (optional)"
                  value={billing.apartment}
                  onChange={(v) => updateBilling("apartment", v)}
                  autoComplete="billing address-line2"
                />

                <div className="grid gap-3 sm:grid-cols-3">
                  <Field
                    id="billingCity"
                    label="City"
                    value={billing.city}
                    onChange={(v) => updateBilling("city", v)}
                    autoComplete="billing address-level2"
                    required
                  />
                  <div className="relative">
                    <select
                      id="billingState"
                      value={billing.state}
                      onChange={(e) => updateBilling("state", e.target.value)}
                      className="h-14 w-full appearance-none rounded-lg border border-[#d9d9d9] bg-white px-3.5 pt-5 pb-1.5 text-[0.9375rem] text-ink outline-none focus:border-[#1a73e8]"
                    >
                      {STATES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <label
                      htmlFor="billingState"
                      className="pointer-events-none absolute left-3.5 top-1.5 text-[0.6875rem] text-ink-soft"
                    >
                      State
                    </label>
                  </div>
                  <Field
                    id="billingPincode"
                    label="PIN code"
                    value={billing.pincode}
                    onChange={(v) => updateBilling("pincode", v.replace(/\D/g, ""))}
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[1-9][0-9]{5}"
                    autoComplete="billing postal-code"
                    required
                  />
                </div>

                <Field
                  id="billingPhone"
                  label="Phone (optional)"
                  value={billing.phone}
                  onChange={(v) => updateBilling("phone", v.replace(/\D/g, ""))}
                  inputMode="tel"
                  maxLength={10}
                  autoComplete="billing tel-national"
                />
              </div>
            )}

            {error && (
              <p role="alert" className="mt-6 rounded-lg bg-sale px-4 py-3 text-[0.875rem] text-sale-ink">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="mt-6 w-full rounded-lg bg-[#1a73e8] py-4 text-[1rem] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Opening payment..." : "Pay now"}
            </button>

            <nav className="mt-8 flex flex-wrap gap-5 border-t border-line pt-6 text-[0.8125rem] text-[#1a73e8]">
              <Link href="/pages/refund-policy" className="underline underline-offset-4">
                Refund policy
              </Link>
              <Link href="/pages/shipping-policy" className="underline underline-offset-4">
                Shipping
              </Link>
              <Link href="/pages/privacy-policy" className="underline underline-offset-4">
                Privacy policy
              </Link>
              <Link href="/pages/terms-of-service" className="underline underline-offset-4">
                Terms of service
              </Link>
            </nav>
          </fieldset>
        </form>
      </div>

      {/* Right: summary */}
      <aside className="border-l border-line bg-[#f5f5f5] lg:sticky lg:top-[72px] lg:h-[calc(100dvh-72px)] lg:overflow-y-auto self-start">
        <div className="w-full px-gutter py-10 lg:max-w-[560px] lg:px-12">
          <ul className="flex flex-col gap-5">
            {lines.map((line) => (
              <li key={line.productId} className="flex items-center gap-4">
                <div className="relative size-16 shrink-0">
                  <div className="relative h-full w-full overflow-hidden rounded-lg border border-line bg-white">
                    {line.image && (
                      <Image src={line.image} alt="" fill sizes="64px" className="object-cover" />
                    )}
                  </div>
                  <span className="absolute -right-2 -top-2 z-10 flex size-[22px] items-center justify-center rounded-full bg-[#5c5c5c] text-[0.6875rem] font-medium text-white">
                    {line.quantity}
                  </span>
                </div>
                <p className="min-w-0 flex-1 text-[0.875rem] leading-snug text-ink">
                  {line.title}
                </p>
                <span className="shrink-0 text-[0.875rem] text-ink">
                  {formatINR(line.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex gap-3">
            <input
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              placeholder="Discount code"
              aria-label="Discount code"
              className="h-12 flex-1 rounded-lg border border-[#d9d9d9] bg-white px-3.5 text-[0.9375rem] outline-none focus:border-[#1a73e8]"
            />
            <button
              type="button"
              onClick={() => setAppliedCode(discountCode.trim())}
              disabled={!discountCode.trim()}
              className="rounded-lg bg-[#e3e3e3] px-6 text-[0.875rem] text-ink transition-colors hover:bg-[#d5d5d5] disabled:text-ink-faint"
            >
              Apply
            </button>
          </div>

          {appliedCode && (
            <p className="mt-2 text-[0.8125rem] text-ink-soft">
              Code <span className="font-medium text-ink">{appliedCode}</span> will be
              checked when you pay.
            </p>
          )}

          <dl className="mt-7 flex flex-col gap-3 text-[0.875rem]">
            <div className="flex justify-between">
              <dt className="text-ink">Subtotal &middot; {itemCount} items</dt>
              <dd className="text-ink">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink">Shipping</dt>
              <dd className="text-ink-soft">
                {form.pincode.length === 6
                  ? subtotal >= 99900
                    ? "Free"
                    : formatINR(4900)
                  : "Enter shipping address"}
              </dd>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <dt className="text-[1.0625rem] font-medium text-ink">Total</dt>
              <dd className="text-[1.375rem] font-semibold text-ink">
                <span className="mr-1.5 text-[0.75rem] font-normal text-ink-soft">INR</span>
                {formatINR(
                  subtotal + (form.pincode.length === 6 && subtotal < 99900 ? 4900 : 0),
                )}
              </dd>
            </div>
          </dl>
        </div>
      </aside>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
