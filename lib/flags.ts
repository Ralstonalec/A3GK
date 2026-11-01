/** Safe for client components: only reads a NEXT_PUBLIC flag, never a secret. Set NEXT_PUBLIC_CUSTOMER_ACCOUNTS=1 once the Customer Account API is configured. */
export const customerAccountEnabled = process.env.NEXT_PUBLIC_CUSTOMER_ACCOUNTS === '1';
