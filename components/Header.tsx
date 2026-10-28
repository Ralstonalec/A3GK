'use client';

import Link from 'next/link';
import { useState } from 'react';
import { NAV } from '@/lib/content';
import { useCart } from '@/lib/cart-context';

export function Header() {
  const { cart, setOpen } = useCart();
  const [menu, setMenu] = useState(false);
  const count = cart?.totalQuantity ?? 0;
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#080a0e] via-[#080a0e]/85 to-transparent md:hidden" />
      <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-3xl font-extrabold tracking-tight" aria-label="A3GK home">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 2l8.66 5v10L12 22 3.34 17V7L12 2z" stroke="rgb(var(--accent))" strokeWidth="2" /><path d="M12 8v8M8 12h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
          A3GK
        </Link>
        <nav aria-label="Main" className="glass hidden items-center gap-1 rounded-full p-1.5 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-accent hover:text-ink">{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(true)} className="glass relative flex h-12 items-center gap-2 rounded-full px-5 text-sm font-bold" aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 016 0" /></svg>
            <span aria-hidden>{count}</span>
          </button>
          <button className="glass flex h-12 w-12 items-center justify-center rounded-full md:hidden" aria-expanded={menu} aria-controls="mobile-nav" aria-label="Menu" onClick={() => setMenu((m) => !m)}>
            <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
      </div>
      {menu && (
        <nav id="mobile-nav" aria-label="Mobile" className="glass mx-4 rounded-3xl px-4 py-2 md:hidden">
          {NAV.map((n) => <Link key={n.href} href={n.href} onClick={() => setMenu(false)} className="block py-3 font-semibold">{n.label}</Link>)}
        </nav>
      )}
    </header>
  );
}
