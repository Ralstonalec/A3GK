/**
 * Shopify Customer Account API (new customer accounts): OAuth 2.0 authorization code flow with PKCE, then GraphQL.
 * Works alongside the Storefront API (products, collections, cart) in lib/shopify.ts, and alongside the Supabase
 * accounts (club list, saved sizes). Server only: nothing here may be imported by a client component.
 *
 * Needs SHOPIFY_STORE_DOMAIN and SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID. Setup steps: docs/SHOPIFY-ACCOUNTS.md.
 */
import { cookies } from 'next/headers';
import { siteOriginFrom } from './site-url';

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID;

export const customerAccountConfigured = Boolean(domain && clientId);

export const COOKIE = { access: 'sca_at', refresh: 'sca_rt', idToken: 'sca_id', oauth: 'sca_oauth' } as const;

type Endpoints = { authorization: string; token: string; logout: string; graphql: string };
let cached: { at: number; value: Endpoints } | null = null;

/** Endpoints come from the store itself, so no shop id or API version is hard-coded here. */
export async function endpoints(): Promise<Endpoints> {
  if (!domain) throw new Error('Shopify is not configured');
  if (cached && Date.now() - cached.at < 3_600_000) return cached.value;
  const [oidc, api] = await Promise.all([
    fetch(`https://${domain}/.well-known/openid-configuration`, { cache: 'no-store' }).then((r) => r.json()),
    fetch(`https://${domain}/.well-known/customer-account-api`, { cache: 'no-store' }).then((r) => r.json()),
  ]);
  const value: Endpoints = { authorization: oidc.authorization_endpoint, token: oidc.token_endpoint, logout: oidc.end_session_endpoint, graphql: api.graphql_api };
  if (!value.authorization || !value.token || !value.graphql) throw new Error('Customer Account API discovery failed');
  cached = { at: Date.now(), value };
  return value;
}

const b64url = (buf: ArrayBuffer | Uint8Array) => Buffer.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf)).toString('base64url');
export const randomString = (bytes = 32) => b64url(crypto.getRandomValues(new Uint8Array(bytes)));
export async function challengeFor(verifier: string) {
  return b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
}

export const siteOrigin = (fallback: string) => siteOriginFrom(process.env.NEXT_PUBLIC_SITE_URL, fallback);
export const redirectUri = (fallbackOrigin: string) => `${siteOrigin(fallbackOrigin)}/customer/callback`;

/** Only same-site relative paths are accepted as a return target. */
export const safeNext = (v: string | null | undefined, fallback = '/customer/orders') => (v && v.startsWith('/') && !v.startsWith('//') ? v : fallback);

export type Tokens = { access_token: string; refresh_token?: string; id_token?: string; expires_in: number };

export async function exchange(params: Record<string, string>, origin: string): Promise<Tokens> {
  const { token } = await endpoints();
  const res = await fetch(token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: origin },
    body: new URLSearchParams({ client_id: clientId ?? '', ...params }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Token endpoint ${res.status}`);
  return res.json();
}

export const jwtClaims = (jwt: string): Record<string, unknown> => {
  try { return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString()); } catch { return {}; }
};

export const sessionCookie = (maxAge: number) => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge });

export function hasSession() {
  const c = cookies();
  return Boolean(c.get(COOKIE.access)?.value || c.get(COOKIE.refresh)?.value);
}

export class AuthRequired extends Error { constructor(public canRefresh: boolean) { super('Customer sign-in required'); } }

/** Runs a Customer Account API query for the signed-in customer. Throws AuthRequired when the token is missing or expired. */
export async function customerQuery<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const c = cookies();
  const access = c.get(COOKIE.access)?.value;
  if (!access) throw new AuthRequired(Boolean(c.get(COOKIE.refresh)?.value));
  const { graphql } = await endpoints();
  const res = await fetch(graphql, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: access },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });
  if (res.status === 401 || res.status === 403) throw new AuthRequired(Boolean(c.get(COOKIE.refresh)?.value));
  if (!res.ok) throw new Error(`Customer Account API ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e: { message: string }) => e.message).join('; '));
  return json.data as T;
}

export type CustomerOrder = {
  id: string; name: string; processedAt: string; financialStatus: string | null;
  totalPrice: { amount: string; currencyCode: string };
  lineItems: { nodes: { title: string; quantity: number }[] };
  statusPageUrl: string | null;
};
export type CustomerProfile = {
  firstName: string | null; lastName: string | null;
  emailAddress: { emailAddress: string } | null;
  orders: { nodes: CustomerOrder[] };
};

export async function getCustomerWithOrders() {
  const d = await customerQuery<{ customer: CustomerProfile }>(`query {
    customer {
      firstName lastName
      emailAddress { emailAddress }
      orders(first: 25, sortKey: PROCESSED_AT, reverse: true) { nodes {
        id name processedAt financialStatus
        totalPrice { amount currencyCode }
        lineItems(first: 10) { nodes { title quantity } }
        statusPageUrl
      } }
    }
  }`);
  return d.customer;
}
