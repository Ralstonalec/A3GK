/** Safe for client components: only reads a NEXT_PUBLIC flag, never a secret. Set NEXT_PUBLIC_CUSTOMER_ACCOUNTS=1 once the Customer Account API is configured. */
export const customerAccountEnabled = process.env.NEXT_PUBLIC_CUSTOMER_ACCOUNTS === '1';

/**
 * Whether people can buy yet. Off by default: add-to-cart and checkout show "Coming soon" and the cart API refuses writes.
 * Set NEXT_PUBLIC_SALES_OPEN=1 in Vercel (then redeploy) to open the store.
 */
export const salesOpen = process.env.NEXT_PUBLIC_SALES_OPEN === '1';
