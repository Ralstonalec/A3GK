'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { joinClub, type JoinState } from '@/app/club/actions';

const field = 'block min-h-[52px] w-full rounded-full border border-white/25 bg-black/30 px-6 text-base text-white placeholder:text-white/40 focus:border-accent focus:outline-none';

function Submit() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn-primary w-full whitespace-nowrap sm:w-auto disabled:opacity-60">{pending ? 'Joining…' : 'Join the club'}</button>;
}

export function ClubForm({ id = 'join' }: { id?: string }) {
  const [state, action] = useFormState<JoinState, FormData>(joinClub, {});
  if (state.ok) {
    return (
      <div id={id} role="status" className="rounded-3xl border border-accent/50 bg-accent/10 p-6">
        <p className="font-display text-2xl font-extrabold uppercase">You are in.</p>
        <p className="mt-2 text-white/80">We will email you when something new drops.</p>
      </div>
    );
  }
  return (
    <form id={id} action={action} className="space-y-4">
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor={`${id}-email`}>Email address</label>
        <input id={`${id}-email`} name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" className={field} />
        <Submit />
      </div>
      <label className="flex min-h-[44px] items-start gap-3 text-sm text-white/75">
        <input name="consent" type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-[rgb(var(--accent))]" />
        <span>Email me when new A3GK products drop. Free to join, unsubscribe any time. See our <Link href="/privacy" className="underline underline-offset-4">privacy policy</Link>.</span>
      </label>
      {state.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}
    </form>
  );
}
