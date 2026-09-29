# HUEGLAM — Next.js storefront

A self-hosted replacement for the HUEGLAM Shopify store, built to remove the
monthly Shopify subscription. Products, cart, checkout, payments, orders,
customer accounts and the admin panel all live here.

- **Framework** — Next.js 16 (App Router), React 19, TypeScript, Tailwind v4
- **Database** — MongoDB (Atlas) via Mongoose. Nothing else; there is no SQL
  layer and no ORM besides Mongoose.
- **Payments** — Razorpay (test mode until you switch keys)
- **Email** — Resend (optional; order confirmations are skipped when unset)

---

## Running it

```bash
npm run dev
```

The site needs a database. There are **no built-in fallbacks**: with `MONGODB_URI`
unset or unreachable, the storefront renders with no products, no banners and no
announcements rather than showing placeholder content. That is deliberate — a
fallback catalogue means the shop looks fine while the admin is reading nothing,
and deleting a banner appears to do nothing.

---

## Setup

### 1. Database (MongoDB Atlas — the free tier is plenty at this volume)

1. Create a cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Connect → Drivers** and copy the connection string.
3. Put it in `.env.local` as `MONGODB_URI`, with the database name in the path:
   `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/hueglam?retryWrites=true&w=majority`
4. Under **Network Access**, allow the IPs your host will connect from.

```bash
npm run db:seed
```

That one command builds the indexes, creates the admin login, inserts the five
products and fills the homepage content collections.

`db:seed` is safe to re-run and never destroys anything:

| | behaviour on re-run |
|---|---|
| Admin user | password reset to the current `ADMIN_PASSWORD` — that is the point of it |
| Products | inserted only if the handle is missing, so live stock and admin edits survive |
| Announcements, banners, reels, Instagram | filled **only if the collection is empty**, so anything you deleted stays deleted |
| Orders, customers | never touched |

### 2. Admin login

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local` before seeding. The seed
refuses a password shorter than 12 characters — it is the only credential
standing between the internet and your order data.

Generate `AUTH_SECRET` (required; sign-in is disabled without it):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Sign in at `/admin`. Notes:

- Admin and customer sessions are separate by cookie name *and* JWT audience, so
  a customer token is rejected by the admin panel and vice versa.
- Failed sign-ins are throttled in the database: 5 per account and 20 per IP in
  15 minutes. The throttle runs *before* the password check, so a locked account
  stays locked even for the correct password.
- Changing `AUTH_SECRET` invalidates every session — that is how you sign
  everyone out at once.

### 3. Payments (Razorpay)

1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com) and
   complete KYC (PAN, bank account, business proof).
2. Copy the **test** keys into `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and
   `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
3. **Register the webhook** — Settings → Webhooks → Add New Webhook:
   - URL `https://your-domain.com/api/razorpay/webhook`
   - Events `payment.captured`, `payment.failed`
   - Secret must match `RAZORPAY_WEBHOOK_SECRET`

   This is not optional in practice. The browser callback only fires if the
   customer's tab survives long enough to send it; without the webhook, someone
   who pays and closes the tab leaves an order stuck at `pending` with their
   money taken.
4. Place a test order with Razorpay's published test card numbers.
5. Swap in live keys only once test orders work end to end.

Razorpay activation requires your live site to carry reachable shipping, refund,
privacy, terms and contact pages. Those exist at `/pages/*`.

### 4. Email (optional but expected)

Add `RESEND_API_KEY` and verify your sending domain at
[resend.com](https://resend.com). Leave it blank and order confirmations are
skipped with a console warning — the order still completes, the customer just
gets no receipt.

### 5. Deploy

Push to GitHub, import into your host, and copy the same environment variables
across. **Read the uploads warning below before choosing a host.**

---

## Before you take real money

- [ ] **Move image uploads off local disk.** `app/api/admin/upload/route.ts`
      writes into `public/uploads/`. On Vercel, Netlify or Cloud Run that path is
      read-only or wiped on every deploy, and it is not shared between
      instances. This only works as-is on a single VPS with a persistent disk.
      Otherwise switch it to object storage (R2, S3, Vercel Blob, Cloudinary).
- [ ] **Register the Razorpay webhook** (see above).
- [ ] **Set `RESEND_API_KEY`** so customers get confirmations.
- [ ] **Set a real `ADMIN_EMAIL`** — `you@hueglam.com` is a placeholder.
- [ ] **Add rate limiting at the edge.** Only sign-in is throttled in-app;
      `/api/orders/lookup` and `/api/checkout/create-order` are not.
- [ ] **Add security headers** (CSP, HSTS, X-Frame-Options,
      X-Content-Type-Options) in `next.config.ts`.
- [ ] **Replace the policy pages.** The bodies in `lib/pages-content.ts` are
      scaffolds, not legal advice. Entries marked `needsReview: true` matter most.
- [ ] **Add your registered business address** to `/pages/contact`.
- [ ] **Check stock numbers** in `/admin/products` — seeded values are guesses.
- [ ] **Export your Shopify orders** before cancelling the plan. Once the
      subscription lapses you lose that order history.
- [ ] **Drop any development-era `orders` documents** from Atlas. Old records
      predate the current order schema and will render with blanks and zeros.

### Known limitations

- **Overselling window.** Stock is checked when the order is created and only
  decremented once payment succeeds, so two buyers can both clear the check for
  the last unit. Inventory is clamped at zero in the database, so the worst case
  is one refund rather than negative stock.
- **No session revocation.** A session stays valid until it expires (30 days for
  customers, 12 hours for admin) even if the account is deleted. Rotating
  `AUTH_SECRET` is the only way to revoke, and it signs out everyone.
- **No coupon admin page.** Coupon logic works — percent, fixed, expiry,
  minimum subtotal, usage counting — but coupons have to be inserted into the
  `coupons` collection by hand.
- **Marquee copy is hardcoded** in `components/Marquee.tsx`, unlike the
  announcement bar which is admin-editable.

---

## Project layout

```
app/
  (shop)/          storefront — home, collections, product, cart, checkout, account, order
  admin/           admin panel (dashboard, orders, products, content)
  api/             checkout create/verify, razorpay webhook, order lookup, upload, account
components/        UI, cart store, admin forms and shell
lib/
  mongodb.ts       lazy connection, cached across hot reloads
  queries.ts       all storefront and admin reads
  types.ts         the shapes the app passes around, independent of the driver
  pricing.ts       server-side totals — the only place money is decided
  fulfil-order.ts  the paid transition, shared by the callback and the webhook
  auth.ts          admin sessions
  customer-auth.ts customer sessions
  rate-limit.ts    failed-login throttling
  razorpay.ts      payment client + signature verification
  products-seed.ts the launch catalogue, used only by the seed script
models/            Mongoose schemas
scripts/seed.ts    indexes, admin user, catalogue, homepage content
public/products/   product images
public/uploads/    admin uploads (gitignored)
```

### How money is handled

Prices are stored in **paise** as integers, never floats. The browser's cart is
display-only: `/api/checkout/create-order` re-reads every price and stock level
from the database and recomputes the total, so a tampered client payload cannot
change what is charged. The order is recorded against the **session's** email,
never the one in the request body. Payment is only accepted after the Razorpay
HMAC signature verifies.

The `pending → paid` transition is a single conditional update, so the browser
callback and the webhook can both arrive, in either order, without drawing down
stock or counting a coupon twice.

Shipping is calculated on the subtotal **after** any discount. A ₹999 cart ships
free, but applying a 10% coupon drops it below the threshold and ₹49 shipping is
added. If you want eligibility judged before discounts, change `priceOrder` in
`lib/pricing.ts`.

### Editing products

Everything is editable in `/admin/products`: title, handle, price, sale price,
SKU, stock, images, description, active ingredients, benefits, ingredients,
directions and care guide. The PDP accordions render only the fields you fill
in. `lib/products-seed.ts` is now only the initial catalogue for `db:seed`, not
a live source of truth.

---

## Costs versus Shopify

| | Shopify | This |
|---|---|---|
| Platform | monthly plan | Rs. 0 |
| Hosting | included | free tier |
| Database | included | MongoDB Atlas free tier |
| Email | included | Resend free tier (3k/mo) |
| Image storage | included | free tier, or a disk you already pay for |
| Payment gateway | ~2% + Shopify's extra fee on third-party gateways | Razorpay ~2% |
| Maintenance | Shopify's problem | yours |

At current volume everything fits inside free tiers. The real cost is that
uptime, security updates and bugs become your responsibility.
