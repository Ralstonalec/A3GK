'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { saveProfile, saveSizes, type FormState } from '@/app/account/actions';

const field = 'mt-1 block min-h-[48px] w-full rounded-xl border border-white/20 bg-white/[0.06] px-4 text-base text-white placeholder:text-white/40 focus:border-accent focus:outline-none';
type Profile = { full_name: string | null; phone: string | null; marketing_opt_in: boolean };
type Sizes = { height_cm: number | null; weight_kg: number | null; chest_cm: number | null; waist_cm: number | null; hip_cm: number | null; inseam_cm: number | null; preferred_top_size: string | null; preferred_bottom_size: string | null; notes: string | null };

function Save({ label = 'Save' }: { label?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">{pending ? 'Saving…' : label}</button>;
}
function Msg({ s }: { s: FormState }) {
  if (s.error) return <p role="alert" className="text-sm text-red-200">{s.error}</p>;
  if (s.ok) return <p role="status" className="text-sm text-accent">Saved.</p>;
  return null;
}

export function ProfileForm({ email, profile }: { email: string; profile: Profile }) {
  const [state, action] = useFormState(saveProfile, {} as FormState);
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-white/65">Signed in as <strong className="text-white">{email}</strong></p>
      <label className="block text-sm font-semibold">Name<input name="full_name" defaultValue={profile.full_name ?? ''} maxLength={120} autoComplete="name" className={field} /></label>
      <label className="block text-sm font-semibold">Phone<input name="phone" type="tel" defaultValue={profile.phone ?? ''} maxLength={40} autoComplete="tel" className={field} /></label>
      <label className="flex min-h-[44px] items-center gap-3 text-sm"><input name="marketing_opt_in" type="checkbox" defaultChecked={profile.marketing_opt_in} className="h-5 w-5 accent-[rgb(var(--accent))]" /> Email me about new products</label>
      <div className="flex items-center gap-4"><Save /><Msg s={state} /></div>
    </form>
  );
}

const N = ({ name, label, v }: { name: string; label: string; v: number | null }) => (
  <label className="block text-sm font-semibold">{label}<input name={name} type="number" inputMode="decimal" step="0.1" defaultValue={v ?? ''} className={field} /></label>
);

export function SizeForm({ sizes }: { sizes: Sizes | null }) {
  const [state, action] = useFormState(saveSizes, {} as FormState);
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-white/65">Saved for your own reference. The size guide says how to measure.</p>
      <div className="grid grid-cols-2 gap-4">
        <N name="height_cm" label="Height (cm)" v={sizes?.height_cm ?? null} />
        <N name="weight_kg" label="Weight (kg)" v={sizes?.weight_kg ?? null} />
        <N name="chest_cm" label="Chest (cm)" v={sizes?.chest_cm ?? null} />
        <N name="waist_cm" label="Waist (cm)" v={sizes?.waist_cm ?? null} />
        <N name="hip_cm" label="Hip (cm)" v={sizes?.hip_cm ?? null} />
        <N name="inseam_cm" label="Inseam (cm)" v={sizes?.inseam_cm ?? null} />
        <label className="block text-sm font-semibold">Top size<input name="preferred_top_size" defaultValue={sizes?.preferred_top_size ?? ''} maxLength={20} className={field} /></label>
        <label className="block text-sm font-semibold">Leggings size<input name="preferred_bottom_size" defaultValue={sizes?.preferred_bottom_size ?? ''} maxLength={20} className={field} /></label>
      </div>
      <label className="block text-sm font-semibold">Notes<textarea name="notes" defaultValue={sizes?.notes ?? ''} maxLength={500} rows={3} className={`${field} py-3`} /></label>
      <div className="flex items-center gap-4"><Save /><Msg s={state} /></div>
    </form>
  );
}

export function PasswordForm() {
  const [msg, setMsg] = useState<FormState>({});
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const pw = String(new FormData(form).get('password') ?? '');
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setMsg({ error: error.message });
    else { setMsg({ ok: true }); form.reset(); }
  }
  return (
    <form id="password" onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm font-semibold">New password<input name="password" type="password" required minLength={8} autoComplete="new-password" className={field} /></label>
      <div className="flex items-center gap-4"><button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">{busy ? 'Saving…' : 'Change password'}</button><Msg s={msg} /></div>
    </form>
  );
}
