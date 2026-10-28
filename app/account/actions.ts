'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const text = (f: FormData, k: string, max: number) => {
  const v = String(f.get(k) ?? '').trim().slice(0, max);
  return v === '' ? null : v;
};
const num = (f: FormData, k: string) => {
  const raw = String(f.get(k) ?? '').trim();
  if (raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
};

export type FormState = { ok?: boolean; error?: string };

async function requireUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

export async function saveProfile(_: FormState, f: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from('profiles').update({ full_name: text(f, 'full_name', 120), phone: text(f, 'phone', 40), marketing_opt_in: f.get('marketing_opt_in') === 'on' }).eq('id', user.id);
  if (error) return { error: 'Could not save your details.' };
  revalidatePath('/account');
  return { ok: true };
}

export async function saveSizes(_: FormState, f: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const row = {
    user_id: user.id,
    height_cm: num(f, 'height_cm'),
    weight_kg: num(f, 'weight_kg'),
    chest_cm: num(f, 'chest_cm'),
    waist_cm: num(f, 'waist_cm'),
    hip_cm: num(f, 'hip_cm'),
    inseam_cm: num(f, 'inseam_cm'),
    preferred_top_size: text(f, 'preferred_top_size', 20),
    preferred_bottom_size: text(f, 'preferred_bottom_size', 20),
    notes: text(f, 'notes', 500),
  };
  if ([row.height_cm, row.weight_kg, row.chest_cm, row.waist_cm, row.hip_cm, row.inseam_cm].some((n) => typeof n === 'number' && Number.isNaN(n))) return { error: 'Measurements must be numbers.' };
  const { error } = await supabase.from('size_profiles').upsert(row);
  if (error) return { error: 'Check the measurements are realistic values (in cm and kg).' };
  revalidatePath('/account');
  return { ok: true };
}

export async function removeSaved(f: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(f.get('id') ?? '');
  await supabase.from('saved_items').delete().eq('id', id).eq('user_id', user.id);
  revalidatePath('/account');
}

export async function toggleSaved(handle: string): Promise<{ saved: boolean; error?: string; signedOut?: boolean }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { saved: false, signedOut: true };
  if (typeof handle !== 'string' || handle.length < 1 || handle.length > 120) return { saved: false, error: 'Could not save this item.' };
  // delete-then-insert, each a single statement, so a double click can't create a duplicate (unique key + ignoreDuplicates)
  const { data: removed } = await supabase.from('saved_items').delete().eq('user_id', user.id).eq('product_handle', handle).select('id');
  if (removed && removed.length) {
    revalidatePath('/account');
    return { saved: false };
  }
  const { error } = await supabase.from('saved_items').upsert({ user_id: user.id, product_handle: handle }, { onConflict: 'user_id,product_handle', ignoreDuplicates: true });
  if (error) return { saved: false, error: 'Could not save this item.' };
  revalidatePath('/account');
  return { saved: true };
}

export async function signOut() {
  await createClient().auth.signOut();
  redirect('/');
}
