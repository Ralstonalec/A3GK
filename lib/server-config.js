/**
 * Server-only configuration (secrets).  Never import this from a component.
 */

function real(value) {
  return Boolean(value) && !/xxx|^\*+$|your-/i.test(value);
}

export const serverConfig = {
  get stripeSecretKey() {
    return process.env.STRIPE_SECRET_KEY || '';
  },
  get stripeWebhookSecret() {
    return process.env.STRIPE_WEBHOOK_SECRET || '';
  },
  get stripeAutomaticTax() {
    return process.env.STRIPE_AUTOMATIC_TAX === 'true';
  },
  get shopifyAdminKey() {
    return process.env.SHOPIFY_ADMIN_API_KEY || '';
  },
  get shopifyAdminSecret() {
    return process.env.SHOPIFY_ADMIN_API_SECRET || '';
  },
  /** Webhook HMAC secret: dedicated override, else the app client secret. */
  get shopifyWebhookSecret() {
    return process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_ADMIN_API_SECRET || '';
  },
  get gaApiSecret() {
    return process.env.GA_API_SECRET || '';
  },
  get analyticsWebhookUrl() {
    return process.env.ANALYTICS_WEBHOOK_URL || '';
  },
  get instagramToken() {
    return process.env.INSTAGRAM_ACCESS_TOKEN || '';
  },
  get kvUrl() {
    return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  },
  get kvToken() {
    return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  },
};

export function isStripeConfigured() {
  return real(serverConfig.stripeSecretKey);
}

export function isKvConfigured() {
  return real(serverConfig.kvUrl) && real(serverConfig.kvToken);
}

export function isProduction() {
  return process.env.NODE_ENV === 'production';
}
