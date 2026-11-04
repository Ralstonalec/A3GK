'use client';

import { useState } from 'react';

const field = 'mt-1 block min-h-[48px] w-full rounded-xl border border-white/20 bg-white/[0.06] px-4 text-base text-white placeholder:text-white/40 focus:border-accent focus:outline-none';

/** Opens the parcel's live status on 17TRACK, which follows most carriers, including the international postal services. */
export function TrackForm() {
  const [error, setError] = useState<string | null>(null);
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const n = String(new FormData(e.currentTarget).get('number') ?? '').replace(/\s+/g, '').toUpperCase();
    if (!/^[A-Z0-9-]{6,40}$/.test(n)) { setError('Enter the tracking number from your shipping email, using letters and numbers only.'); return; }
    setError(null);
    window.open(`https://t.17track.net/en#nums=${encodeURIComponent(n)}`, '_blank', 'noopener,noreferrer');
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <label className="block text-sm font-semibold">Tracking number
        <input name="number" required maxLength={60} autoComplete="off" spellCheck={false} placeholder="e.g. RR123456789CN" className={field} aria-describedby="track-help" />
      </label>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button type="submit" className="btn-primary">Track my parcel</button>
      <p id="track-help" className="text-xs text-white/60">This opens the carrier tracking on 17TRACK in a new tab. We do not send them your name or address.</p>
    </form>
  );
}
