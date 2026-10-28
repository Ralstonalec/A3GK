'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { supabaseConfigured } from '@/lib/supabase/env';

const field = 'mt-1 block min-h-[48px] w-full rounded-xl border border-white/20 bg-white/[0.06] px-4 text-base text-white placeholder:text-white/40 focus:border-accent focus:outline-none';

export function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  if (!supabaseConfigured) return null;
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setState('sending');
    const { error } = await createClient().from('contact_messages').insert({
      name: String(f.get('name') ?? '').trim(),
      email: String(f.get('email') ?? '').trim(),
      order_number: String(f.get('order_number') ?? '').trim() || null,
      message: String(f.get('message') ?? '').trim(),
    });
    if (error) { setState('error'); return; }
    form.reset();
    setState('sent');
  }
  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <label className="block text-sm font-semibold">Name<input name="name" required maxLength={120} autoComplete="name" className={field} /></label>
      <label className="block text-sm font-semibold">Email<input name="email" type="email" required maxLength={254} autoComplete="email" className={field} /></label>
      <label className="block text-sm font-semibold">Order number (optional)<input name="order_number" maxLength={40} className={field} /></label>
      <label className="block text-sm font-semibold">Message<textarea name="message" required maxLength={4000} rows={5} className={`${field} py-3`} /></label>
      <button type="submit" disabled={state === 'sending'} className="btn-primary disabled:opacity-60">{state === 'sending' ? 'Sending…' : 'Send message'}</button>
      {state === 'sent' && <p role="status" className="text-sm text-accent">Message sent. We will reply by email.</p>}
      {state === 'error' && <p role="alert" className="text-sm text-red-200">Could not send. Check the fields and try again.</p>}
    </form>
  );
}
