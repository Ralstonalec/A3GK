'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Mode = 'signin' | 'signup' | 'reset';

const field = 'mt-1 block min-h-[48px] w-full rounded-xl border border-white/20 bg-white/[0.06] px-4 text-base text-white placeholder:text-white/40 focus:border-accent focus:outline-none';

export function AuthForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError === 'link' ? 'That link has expired or was already used. Request a new one.' : null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') ?? '').trim();
    const password = String(f.get('password') ?? '');
    const supabase = createClient();
    const callback = `${window.location.origin}/auth/callback`;
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/account');
        router.refresh();
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: callback, data: { full_name: String(f.get('name') ?? '').trim(), marketing_opt_in: f.get('marketing_opt_in') === 'on' } } });
        if (error) throw error;
        if (data.session) { router.push('/account'); router.refresh(); }
        else setNotice('Check your email to confirm your account, then sign in.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${callback}?next=/account#password` });
        if (error && (error as { code?: string }).code?.startsWith('over_')) throw error;
        setNotice('If that email has an account, a reset link is on its way.');
      }
    } catch (err) {
      // Same wording whether or not the account exists, so the form can't be used to find out who has one.
      const code = (err as { code?: string } | null)?.code ?? '';
      if (code === 'weak_password') setError('Choose a longer or less common password.');
      else if (code.startsWith('over_')) setError('Too many attempts. Wait a few minutes and try again.');
      else if (mode === 'signin') setError('We could not sign you in. Check your email and password.');
      else if (mode === 'signup') setError('We could not create that account. If you already have one, sign in or reset your password.');
      else setError('Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass mx-auto w-full max-w-md rounded-[2rem] p-6 md:p-10">
      <h1 className="h2 text-4xl">{mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate={false}>
        {mode === 'signup' && (
          <label className="block text-sm font-semibold">Name
            <input name="name" type="text" autoComplete="name" maxLength={120} className={field} />
          </label>
        )}
        <label className="block text-sm font-semibold">Email
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
        {mode !== 'reset' && (
          <label className="block text-sm font-semibold">Password
            <input name="password" type="password" required minLength={8} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} className={field} />
          </label>
        )}
        {mode === 'signup' && (
          <label className="flex min-h-[44px] items-start gap-3 text-sm text-white/80">
            <input name="marketing_opt_in" type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[rgb(var(--accent))]" />
            <span>Email me about new products and member rewards. You can unsubscribe at any time.</span>
          </label>
        )}
        {error && <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {notice && <p role="status" className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm">{notice}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
        </button>
      </form>
      <div className="mt-6 flex flex-col gap-2 text-sm">
        {mode !== 'signin' && <button type="button" className="min-h-[44px] text-left underline underline-offset-4" onClick={() => { setMode('signin'); setError(null); setNotice(null); }}>I already have an account</button>}
        {mode !== 'signup' && <button type="button" className="min-h-[44px] text-left underline underline-offset-4" onClick={() => { setMode('signup'); setError(null); setNotice(null); }}>Create an account</button>}
        {mode === 'signin' && <button type="button" className="min-h-[44px] text-left underline underline-offset-4" onClick={() => { setMode('reset'); setError(null); setNotice(null); }}>Forgot your password?</button>}
      </div>
    </div>
  );
}
