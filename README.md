# A3GK storefront

Headless Shopify storefront: Next.js 14 (App Router), Tailwind, React Three Fiber + drei, Framer Motion, Shopify Storefront API.

## Run

```bash
cp .env.example .env.local   # add store domain + Storefront token
npm install
npm run dev
```

Without Shopify credentials the site still renders with unconnected placeholder products; Add to cart is disabled.

## Shopify setup

Create products with handles `padded-base-layer`, `grip-socks`, `sports-bandages`. Use options named e.g. `Size` and `Colour`.
Cart and checkout use the Storefront Cart API via `/api/cart`; checkout hands off to Shopify's `checkoutUrl`.

## Content rule

Unconfirmed facts live in `lib/content.ts` as `null` and render as amber **To confirm** markers (`[data-tbc]`).
Nothing is invented. See `docs/PRE-LAUNCH-CHECKLIST.md`. `npm run check:tbc` fails while any marker remains in the built pages.

## 3D and photography

- `components/three/` places a photoreal rendering (`public/photos/render-set.webp`, AI-generated from the real garment photos, always labelled "Rendering") on a WebGL stage with cursor tilt, particles, view zooms and a scroll tour of each padded area. It is not a scan; real close-up photographs sit beside it as proof. Swap in a supplier 3D model or studio photography when available.
- The real photographs live in `public/photos/`, produced by `scripts/process-photos.py` from the supplied flat lays (`top.jpg`, `leggings.jpg`; needs numpy + Pillow). They are the static fallback (JS off, reduced motion, no WebGL), the close-up gallery and the social preview image.
- The scene is lazy-loaded after idle and skipped for `prefers-reduced-motion` / Save-Data / no WebGL.

## Customer accounts (Supabase)
- Project `a3gk` (ca-central-1). Auth is email + password with email confirmation, plus password reset.
- Tables (all with row-level security): `profiles`, `size_profiles`, `saved_items` (own rows only), `contact_messages` and `email_signups` (public insert, no public read — read them in the Supabase dashboard).
- Routes: `/login` (sign in, sign up, reset), `/account` (details, saved sizes, saved items, password), `/auth/callback`. `middleware.ts` refreshes the session and guards `/account`.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the publishable key is safe in the browser). Without them, account UI is hidden.
- In Supabase → Authentication → URL Configuration, set the Site URL to the live site and add `<site>/auth/callback` to Redirect URLs.
- Orders stay in Shopify; order history in the account page is not connected.
