'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleSaved } from '@/app/account/actions';

export function SaveButton({ handle, initialSaved }: { handle: string; initialSaved: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <button
        type="button"
        aria-pressed={saved}
        disabled={pending}
        onClick={() => start(async () => {
          setError(null);
          const r = await toggleSaved(handle);
          if (r.signedOut) { router.push('/login'); return; }
          if (r.error) setError(r.error);
          else setSaved(r.saved);
        })}
        className="min-h-[44px] text-sm font-semibold underline underline-offset-4 disabled:opacity-60"
      >{saved ? 'Saved for later ✓' : 'Save for later'}</button>
      {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
    </div>
  );
}
