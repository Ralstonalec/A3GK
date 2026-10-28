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

- `components/three/` is a procedural 3D model of the garments (long-sleeve top + leggings, quilted hex pads) built to match the supplied photographs. It is a reconstruction, not a scan; its materials are tuned against the photos.
- The real photographs live in `public/photos/`, produced by `scripts/process-photos.py` from the supplied flat lays (`top.jpg`, `leggings.jpg`; needs numpy + Pillow). They are the static fallback (JS off, reduced motion, no WebGL), the close-up gallery and the social preview image.
- The scene is lazy-loaded after idle and skipped for `prefers-reduced-motion` / Save-Data / no WebGL.
