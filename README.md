# HUEGLAM — Next.js storefront

A self-hosted replacement for the HUEGLAM Shopify store, built to remove the
monthly Shopify subscription. Products, cart, checkout, payments, orders and a
small admin panel all live here.

- **Framework** — Next.js 16 (App Router), React 19, TypeScript, Tailwind v4
- **Database** — Neon Postgres via Drizzle ORM
- **Payments** — Razorpay (test mode until you switch keys)
- **Email** — Resend (optional; skipped when unset)

---

## Running it right now

```bash
npm run dev
```

The storefront works immediately with **no database**. When `DATABASE_URL` is
empty, products are read from `lib/products-seed.ts`. Checkout and the admin
panel need a real database — see below.

---

## Full setup

### 1. Database (Neon — free tier is plenty at this volume)

1. Create a project at [console.neon.tech](https://console.neon.tech).
2. Copy the **pooled** connection string.
3. Put it in `.env.local` as `DATABASE_URL`.

```bash
npm run db:push    # creates the tables
npm run db:seed    # loads the 5 products + creates your admin login
```

`db:seed` is safe to re-run — it updates existing products by handle rather
than duplicating them.

### 2. Admin login

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local` before running
`db:seed`. Generate `AUTH_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then sign in at `/admin`. Re-running `db:seed` resets the admin password to
whatever `ADMIN_PASSWORD` currently is.

### 3. Payments (Razorpay)

1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com) and
   complete KYC (PAN, bank account, business proof).
2. Copy the **test** keys into `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and
   `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
3. Place a test order using Razorpay's published test card numbers.
4. Swap in live keys only once test orders work end to end.

Razorpay activation requires your live site to carry reachable shipping,
refund, privacy, terms and contact pages. Those exist at `/pages/*` — but see
the warning below.

### 4. Email (optional)

Add `RESEND_API_KEY` and verify your sending domain at
[resend.com](https://resend.com). Leave it blank and order confirmations are
skipped with a console warning; nothing else breaks.

### 5. Deploy

Push to GitHub, import into Vercel, and paste the same environment variables
into the Vercel project settings. Point `hueglam.com` at Vercel once you have
tested on the preview URL.

---

## Before you take real money

- [ ] **Replace the policy pages.** The bodies in `lib/pages-content.ts` are
      scaffolds written for this build, not legal advice. Paste in HUEGLAM's
      actual policies and have someone check them. Entries marked
      `needsReview: true` are the ones that matter.
- [ ] **Add your registered business address** to `/pages/contact`.
- [ ] **Run a full test order** with Razorpay test keys.
- [ ] **Check stock numbers** in `/admin/products` — seeded values are guesses.
- [ ] **Export your existing Shopify orders** before cancelling the plan. Once
      the subscription lapses you lose access to that order history.
- [ ] **Set up redirects** if any old Shopify URLs differ from these. Product
      handles were kept identical, so `/products/<handle>` should all still
      resolve.

---

## Project layout

```
app/
  (shop)/          storefront — home, collections, product, cart, checkout, order
  admin/           password-protected admin (orders, products)
  api/             checkout create/verify, order lookup
components/        UI, cart context, admin forms
lib/
  db/schema.ts     Drizzle tables
  products-seed.ts the catalogue — source of truth for seeding
  pricing.ts       server-side totals (the only place money is decided)
  razorpay.ts      payment client + signature verification
  pages-content.ts static page bodies
scripts/seed.ts    loads products and bootstraps admin
public/products/   product images, pulled from the Shopify CDN
```

### How money is handled

Prices are stored in **paise** as integers, never floats. The browser's cart is
display-only: `/api/checkout/create-order` re-reads every price and stock level
from the database and recomputes the total, so a tampered client payload cannot
change what is charged. Payment completion is only accepted after the Razorpay
HMAC signature verifies.

### Editing products

Price, stock, SKU, title, short description and visibility are editable in
`/admin/products` and apply to the storefront immediately.

The long product copy (ingredients, directions) and the image lists live in
`lib/products-seed.ts` — edit that file and re-run `npm run db:seed`. That was a
deliberate trade-off: a full rich-text editor and image uploader was not worth
building for five products.

---

## Costs versus Shopify

| | Shopify | This |
|---|---|---|
| Platform | monthly plan | Rs. 0 |
| Hosting | included | Vercel free tier |
| Database | included | Neon free tier |
| Email | included | Resend free tier (3k/mo) |
| Payment gateway | ~2% + Shopify's extra fee on third-party gateways | Razorpay ~2% |
| Maintenance | Shopify's problem | yours |

At current volume everything fits inside free tiers. The real cost is that
uptime, security updates and bugs become your responsibility.
