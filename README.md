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

## 3D

Scenes are lazy-loaded (`components/LazyScene.tsx`) after idle + in-view, skipped for `prefers-reduced-motion` / Save-Data, and always sit over a static poster (`public/hero-poster.svg`). The hero is a material study, not a garment, until real product models/photos exist.
