import { z } from 'zod';
import {
  FABRICS,
  FONTS,
  LOGO_PLACEMENT_IDS,
  PATTERNS,
  SIZES,
} from './customizer-options';
import { CART_LIMITS, hasShippingMethods, STORE_TERMS } from './store-terms';

/* ── Primitives ────────────────────────────────────────────────────────── */

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex colour like #d4ff3a')
  .transform((v) => v.toLowerCase());

const safeId = z.string().min(1).max(200).regex(/^[\w:/.\-]+$/, 'Invalid identifier');

export const MAX_LOGO_DATA_URL_LENGTH = 400_000; // ≈ 300 KB of image data

/* ── Customizer ────────────────────────────────────────────────────────── */

export const customizationSchema = z.object({
  baseColor: hexColor,
  accentColor: hexColor,
  trimColor: hexColor,
  pattern: z.enum(PATTERNS.map((p) => p.id)),
  fabric: z.enum(FABRICS.map((f) => f.id)),
  playerName: z
    .string()
    .max(14, 'Max 14 characters')
    .regex(/^[A-Za-z0-9 .'\-]*$/, 'Letters, numbers, spaces and . \' - only')
    .transform((v) => v.trim().toUpperCase()),
  playerNumber: z.string().regex(/^\d{0,2}$/, 'Use 0–99'),
  font: z.enum(FONTS.map((f) => f.id)),
  textColor: hexColor,
  logo: z.object({
    enabled: z.boolean(),
    placement: z.enum(LOGO_PLACEMENT_IDS),
    offsetX: z.number().min(-60).max(60),
    offsetY: z.number().min(-60).max(60),
    scale: z.number().min(0.3).max(1.6),
  }),
});

const logoDataUrl = z
  .string()
  .max(MAX_LOGO_DATA_URL_LENGTH, 'Logo is too large — use an image under 300 KB')
  .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, 'Logo must be a PNG, JPEG or WebP image');

export const designSaveSchema = z.object({
  config: customizationSchema,
  size: z.enum(SIZES),
  logoDataUrl: logoDataUrl.optional(),
});

export const designIdSchema = z.string().regex(/^[a-z0-9]{8,24}$/, 'Invalid design id');

/* ── Cart ──────────────────────────────────────────────────────────────── */

const quantity = z.number().int().min(1).max(CART_LIMITS.maxLineQuantity);

export const cartLineInputSchema = z.object({
  variantId: safeId,
  quantity,
  customization: customizationSchema.optional(),
  designId: designIdSchema.optional(),
});

const snapshot = z.array(cartLineInputSchema).max(CART_LIMITS.maxCartLines).default([]);

export const cartRequestSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('add'), line: cartLineInputSchema, snapshot }),
  z.object({ op: z.literal('set'), lineId: safeId, quantity: z.number().int().min(0).max(CART_LIMITS.maxLineQuantity), snapshot }),
  z.object({ op: z.literal('remove'), lineId: safeId, snapshot }),
  z.object({ op: z.literal('clear'), snapshot }),
  z.object({ op: z.literal('sync'), snapshot }),
]);

/* ── Checkout ──────────────────────────────────────────────────────────── */

export const checkoutSchema = z.object({
  email: z.email('Enter a valid email address').max(254),
  lines: z.array(cartLineInputSchema).min(1, 'Your cart is empty').max(CART_LIMITS.maxCartLines),
  // Only meaningful once shipping methods are configured (lib/store-terms.js).
  shippingMethod: hasShippingMethods() ? z.enum(STORE_TERMS.shippingMethods.map((m) => m.id)) : z.string().max(40).optional(),
  // Required only once real terms are published (hasPublishedTerms in lib/store-terms.js); enforced in /api/checkout.
  acceptTerms: z.boolean().default(false),
  // Honeypot: real users never see or fill this field.
  company: z.string().max(0).optional().default(''),
});

/* ── Catalogue query ───────────────────────────────────────────────────── */

export const productsQuerySchema = z.object({
  query: z.string().max(400).optional().default(''),
  first: z.coerce.number().int().min(1).max(50).optional().default(24),
  sort: z.enum(['featured', 'price-asc', 'price-desc', 'newest', 'title']).optional().default('featured'),
  handle: z.string().regex(/^[a-z0-9-]{1,100}$/).optional(),
});

/* ── Analytics ─────────────────────────────────────────────────────────── */

const scalar = z.union([z.string().max(200), z.number(), z.boolean()]);
// GA4 ecommerce events carry `items: [{ item_id, item_name, price, ... }]`
const paramValue = z.union([scalar, z.array(z.record(z.string().max(40), scalar)).max(10)]);

export const analyticsEventSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/, 'Invalid event name'),
  params: z
    .record(z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]{0,39}$/), paramValue)
    .optional()
    .default({})
    .refine((p) => Object.keys(p).length <= 25, 'Too many params'),
});

export const analyticsBatchSchema = z.object({
  clientId: z.string().regex(/^[a-zA-Z0-9._-]{8,64}$/),
  page: z.string().max(300).optional(),
  events: z.array(analyticsEventSchema).min(1).max(20),
});

/* ── Helpers ───────────────────────────────────────────────────────────── */

/**
 * Safe-parse into `{ ok, data }` or `{ ok:false, errors: { path: message } }`.
 * @template T
 * @param {import('zod').ZodType<T>} schema
 */
export function validate(schema, input) {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data, errors: {} };
  const errors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, data: null, errors };
}
