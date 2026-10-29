import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './env';

/**
 * Server-only client with full database access (bypasses row rules). Used only by the Shopify webhook and the
 * unsubscribe page. SUPABASE_SERVICE_ROLE_KEY must never be a NEXT_PUBLIC_ variable, and this file must never be imported from a client component.
 */
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const adminConfigured = Boolean(SUPABASE_URL && key);

export function adminClient() {
  if (!SUPABASE_URL || !key) throw new Error('Supabase service role is not configured');
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
