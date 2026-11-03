'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { supabaseConfigured } from '@/lib/supabase/env';

const field = 'mt-1 block min-h-[48px] w-full rounded-xl border border-white/20 bg-white/[0.06] px-4 text-base text-white placeholder:text-white/40 focus:border-accent focus:outline-none';

/** Saves a team enquiry as a contact message, laid out so it reads cleanly in the inbox. */
export function TeamForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  if (!supabaseConfigured) return null;
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    if (String(f.get('website') ?? '') !== '') { form.reset(); setState('sent'); return; }
    setState('sending');
    const get = (k: string) => String(f.get(k) ?? '').trim();
    const message = [
      'TEAM ORDER ENQUIRY',
      `Team or club: ${get('team')}`,
      `Phone: ${get('phone') || 'not given'}`,
      `Approximate number of players: ${get('players')}`,
      `Pieces wanted: ${get('pieces')}`,
      `Needed by: ${get('needed_by') || 'not given'}`,
      '',
      get('notes'),
    ].join('\n');
    const { error } = await createClient().from('contact_messages').insert({ name: get('name'), email: get('email'), order_number: null, message });
    if (error) { setState('error'); return; }
    form.reset();
    setState('sent');
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Your name<input name="name" required maxLength={120} autoComplete="name" className={field} /></label>
        <label className="block text-sm font-semibold">Email<input name="email" type="email" required maxLength={254} autoComplete="email" className={field} /></label>
        <label className="block text-sm font-semibold">Team or club<input name="team" required maxLength={120} className={field} /></label>
        <label className="block text-sm font-semibold">Phone (optional)<input name="phone" type="tel" maxLength={40} autoComplete="tel" className={field} /></label>
        <label className="block text-sm font-semibold">Approximate number of players<input name="players" required inputMode="numeric" maxLength={6} className={field} /></label>
        <label className="block text-sm font-semibold">Needed by (optional)<input name="needed_by" maxLength={60} placeholder="e.g. start of season" className={field} /></label>
      </div>
      <label className="block text-sm font-semibold">Pieces you are interested in<input name="pieces" required maxLength={200} placeholder="e.g. long-sleeve top and leggings" className={field} /></label>
      <label className="block text-sm font-semibold">Anything else we should know<textarea name="notes" rows={4} maxLength={3000} className={`${field} py-3`} /></label>
      <button type="submit" disabled={state === 'sending'} className="btn-primary disabled:opacity-60">{state === 'sending' ? 'Sending…' : 'Send enquiry'}</button>
      {state === 'sent' && <p role="status" className="text-sm text-accent">Thanks. We have your enquiry and will reply by email.</p>}
      {state === 'error' && <p role="alert" className="text-sm text-red-200">Could not send. Please email us instead using the address above.</p>}
    </form>
  );
}
