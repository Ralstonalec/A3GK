'use server';

import { headers } from 'next/headers';
import { allow, clientIp } from '@/lib/ratelimit';
import { createClient } from '@/lib/supabase/server';

export type JoinState = { ok?: boolean; error?: string };

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

/** Join the A3 Goalkeepers Club list. Public form, so: honeypot, shape check, per-address rate limit. */
export async function joinClub(_: JoinState, f: FormData): Promise<JoinState> {
  if (String(f.get('website') ?? '') !== '') return { ok: true }; // honeypot: pretend success to bots
  if (!allow(`club:${clientIp(headers())}`, 5, 10 * 60_000).ok) return { error: 'Too many attempts. Try again in a few minutes.' };
  const email = String(f.get('email') ?? '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return { error: 'Enter a valid email address.' };
  if (f.get('consent') !== 'on') return { error: 'Tick the box to confirm you want to hear from us.' };
  const { error } = await createClient().from('email_signups').insert({ email, source: 'club' });
  if (error && error.code !== '23505') return { error: 'Could not sign you up right now. Try again shortly.' };
  return { ok: true }; // 23505 = already on the list: same friendly answer, nothing revealed
}
