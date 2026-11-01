# Shopify APIs: Storefront and Customer Account

The site uses both Shopify APIs. They do different jobs and are configured separately.

| API | Job | Code | Env |
| --- | --- | --- | --- |
| Storefront API | Products, collections, metafields, the cart and checkout link | `lib/shopify.ts`, `app/api/cart` | `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN` |
| Customer Account API | Customer sign-in, details, orders | `lib/customer-account.ts`, `app/customer/*` | `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID` |

Supabase accounts (club list, saved sizes, saved items) keep working alongside them. A customer can use either or both.

## Storefront API

Already wired: products (`getProduct`), cart, and now collections (`getCollection(handle)`) and metafields.

Metafields: create the definition in Shopify admin (Settings, Custom data, Products), turn on Storefront API access, then list it in `PRODUCT_METAFIELDS` in `lib/content.ts`. It then appears on `product.metafields["namespace.key"]`. The list is empty until you add some.

## Customer Account API

Flow: `/customer/login` (PKCE) to Shopify, back to `/customer/callback`, then `/customer/orders`. `/customer/refresh` renews an expired session. `/customer/logout` ends it.

Set up in Shopify admin (Headless channel, Customer Account API settings):
1. Copy the **Client ID** into `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID` in Vercel. Use a public client.
2. **Callback URI:** `https://<your-domain>/customer/callback` (add the Vercel preview URL too if you test there).
3. **JavaScript origin:** `https://<your-domain>`
4. **Logout URI:** `https://<your-domain>`
5. Set `NEXT_PUBLIC_SITE_URL` to the same domain, and `NEXT_PUBLIC_CUSTOMER_ACCOUNTS=1` if you want the account icon without Supabase.
6. Customer accounts must be set to **new customer accounts** (not classic) in Settings, Customer accounts.

Notes
- Tokens are held in httpOnly cookies and are never exposed to the browser scripts. Access tokens are short lived and renewed with the refresh token.
- Endpoints and the API version come from the store's own discovery documents, so nothing is hard-coded.
- Not yet tested against a live store: it needs the client ID and registered URLs above.
