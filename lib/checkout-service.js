import Stripe from 'stripe';
import { publicConfig } from './config';
import { STORE_TERMS, termsReadyForLive } from './store-terms';
import { ApiError } from './api';
import { priceLines } from './cart-service';
import { summarize } from './cart-core';
import { getShippingMethod, shippingCostCents } from './shipping';
import { isStripeConfigured, serverConfig } from './server-config';
import { sanitizeText, shortId } from './utils';

/**
 * Checkout session creation.
 *
 * The browser only tells us WHICH variants, HOW MANY and WHICH design; every
 * price is recomputed here from the authoritative catalogue + pricing engine,
 * so a tampered request cannot change what the customer is charged.
 */

/** Trust the Host header only for hosts we recognise; otherwise use the canonical site URL. */
export function getRequestOrigin(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0];
  const host = req.headers.host;
  const known = new Set(
    [new URL(publicConfig.siteUrl).host, process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL].filter(Boolean),
  );
  const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host || '');
  if (host && (known.has(host) || isLocal)) return `${isLocal ? 'http' : proto}://${host}`;
  return publicConfig.siteUrl.replace(/\/$/, '');
}

export function pickProvider({ shopifyCartId, shopifyConfigured }) {
  if (isStripeConfigured()) return 'stripe';
  if (shopifyConfigured && shopifyCartId) return 'shopify';
  return 'demo';
}

/** Price the cart and fail loudly (409) if anything changed since the browser last saw it. */
export async function buildQuote(lines, shippingMethodId) {
  const { lines: priced, notices } = await priceLines(lines);
  if (notices.length || priced.length !== lines.length) {
    const { totalQuantity, subtotalCents } = summarize(priced);
    throw new ApiError(409, 'cart_changed', 'Your cart changed. Please review it and try again.', {
      notices,
      cart: { id: null, source: 'mock', currencyCode: 'USD', lines: priced, totalQuantity, subtotalCents, checkoutUrl: null, notices },
    });
  }
  const subtotalCents = summarize(priced).subtotalCents;
  // Shipping terms are optional (lib/store-terms.js): with none configured there is no shipping line.
  const shipping = getShippingMethod(shippingMethodId);
  const shippingCents = shipping ? shippingCostCents(shipping.id, subtotalCents) : 0;
  return { lines: priced, subtotalCents, shipping, shippingCents, totalCents: subtotalCents + shippingCents };
}

function describeCustomisation(c) {
  const bits = [`Base ${c.baseColor}`, `accent ${c.accentColor}`, c.pattern, c.fabric];
  if (c.playerName) bits.push(`name ${c.playerName}`);
  if (c.playerNumber) bits.push(`#${c.playerNumber}`);
  if (c.logo?.enabled) bits.push(`logo (${c.logo.placement})`);
  return bits.join(' · ');
}

let stripeClient;
function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(serverConfig.stripeSecretKey, {
      maxNetworkRetries: 2,
      timeout: 20_000,
      appInfo: { name: 'a3gk-website', version: '1.0.0' },
    });
  }
  return stripeClient;
}

/** Build the Stripe Checkout Session parameters (exported for unit tests). */
export function buildStripeParams({ quote, email, origin, termsAcceptedAt }) {
  const imageBase = origin.startsWith('https://') ? origin : null;
  const lineItems = quote.lines.map((line) => {
    const name = sanitizeText(`${line.title}${line.variantTitle ? ` — ${line.variantTitle}` : ''}`, 250);
    const description = line.customization ? sanitizeText(describeCustomisation(line.customization), 500) : undefined;
    const metadata = { variant_id: line.variantId };
    if (line.designId) metadata.design_id = line.designId;
    if (line.customization) metadata.customization = JSON.stringify(line.customization).slice(0, 480);
    return {
      quantity: line.quantity,
      price_data: {
        currency: 'usd',
        unit_amount: line.unitCents,
        product_data: {
          name,
          ...(description ? { description } : {}),
          ...(imageBase && line.image?.url?.startsWith('/') ? { images: [`${imageBase}${line.image.url}`] } : {}),
          metadata,
        },
      },
    };
  });

  const { shipping, shippingCents } = quote;
  const designIds = quote.lines.map((l) => l.designId).filter(Boolean).join(',').slice(0, 480);

  return {
    mode: 'payment',
    customer_email: email,
    line_items: lineItems,
    ...(STORE_TERMS.shipTo.length ? { shipping_address_collection: { allowed_countries: STORE_TERMS.shipTo } } : {}),
    ...(shipping
      ? {
          shipping_options: [
            {
              shipping_rate_data: {
                type: 'fixed_amount',
                fixed_amount: { amount: shippingCents, currency: 'usd' },
                display_name: `${shipping.label} shipping`,
                ...(Number.isFinite(shipping.minDays) && Number.isFinite(shipping.maxDays)
                  ? { delivery_estimate: { minimum: { unit: 'business_day', value: shipping.minDays }, maximum: { unit: 'business_day', value: shipping.maxDays } } }
                  : {}),
              },
            },
          ],
        }
      : {}),
    ...(STORE_TERMS.allowPromotionCodes ? { allow_promotion_codes: true } : {}),
    ...(serverConfig.stripeAutomaticTax ? { automatic_tax: { enabled: true } } : {}),
    success_url: `${origin}/cart/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart?cancelled=1`,
    metadata: {
      ...(termsAcceptedAt ? { terms_accepted_at: termsAcceptedAt } : {}),
      ...(designIds ? { design_ids: designIds } : {}),
    },
  };
}

/**
 * @param {{ email: string, lines: any[], shippingMethod: string, acceptTerms?: boolean }} input
 * @param {{ origin: string, shopifyCartId?: string|null, stripe?: any, shopifyConfigured?: boolean }} ctx
 * @returns {Promise<{ provider: 'stripe'|'shopify'|'demo', url: string, reference?: string }>}
 */
export async function createCheckout(input, ctx) {
  const provider = pickProvider({ shopifyCartId: ctx.shopifyCartId, shopifyConfigured: ctx.shopifyConfigured });

  if (provider === 'shopify') {
    const { getCheckoutUrl } = await import('./shopify');
    return { provider, url: await getCheckoutUrl(ctx.shopifyCartId) };
  }

  const quote = await buildQuote(input.lines, input.shippingMethod);

  if (provider === 'stripe') {
    // Fail closed: never take a LIVE payment while shipping destinations are undefined.
    if (serverConfig.stripeSecretKey.startsWith('sk_live_') && !termsReadyForLive()) {
      throw new ApiError(503, 'terms_not_configured', 'Checkout is not available yet: shipping terms have not been configured (see lib/store-terms.js).');
    }
    // Fail closed: a LIVE payment must never be taken for the placeholder catalogue (no Shopify store connected).
    if (serverConfig.stripeSecretKey.startsWith('sk_live_') && ctx.shopifyConfigured === false) {
      throw new ApiError(503, 'demo_catalogue', 'Checkout is not available while the placeholder catalogue is live.');
    }
    const stripe = ctx.stripe || getStripe();
    const session = await stripe.checkout.sessions.create(
      buildStripeParams({ quote, email: input.email, origin: ctx.origin, termsAcceptedAt: input.acceptTerms ? new Date().toISOString() : null }),
    );
    if (!session.url) throw new ApiError(502, 'payment_unavailable', 'Payment provider did not return a checkout URL');
    return { provider, url: session.url, reference: session.id };
  }

  // Demo mode: no money moves. Make that unmistakable on the success page.
  const reference = `A3-DEMO-${shortId(6).toUpperCase()}`;
  return { provider: 'demo', url: `${ctx.origin}/cart/success?demo=1&ref=${reference}`, reference };
}

/**
 * Look up a Stripe Checkout Session so the success page can show the TRUTH
 * (paid / not yet) instead of trusting a bare `?session_id=` in the URL.
 * Only non-sensitive fields are returned.
 */
export async function retrieveCheckoutStatus(sessionId, { stripe } = {}) {
  const client = stripe || getStripe();
  const session = await client.checkout.sessions.retrieve(sessionId);
  return {
    paid: session.payment_status === 'paid' || session.payment_status === 'no_payment_required',
    status: session.status,
    amountTotal: session.amount_total ?? null,
    currency: session.currency ?? null,
  };
}
