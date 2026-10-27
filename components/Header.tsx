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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-charcoal-900 text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-display text-2xl font-extrabold tracking-tight" aria-label="A3GK home">A3GK</Link>
        <nav aria-label="Main" className="hidden items-center gap-7 text-sm font-semibold md:flex">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="hover:text-accent">{n.label}</Link>)}
        </nav>
        <div className="flex items-center gap-1">
          <button onClick={() => setOpen(true)} className="relative flex h-12 w-12 items-center justify-center" aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 016 0" /></svg>
            {count > 0 && <span className="absolute right-1 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-ink">{count}</span>}
          </button>
          <button className="flex h-12 w-12 items-center justify-center md:hidden" aria-expanded={menu} aria-controls="mobile-nav" aria-label="Menu" onClick={() => setMenu((m) => !m)}>
            <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
      </div>
      {menu && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-white/10 px-4 pb-3 md:hidden">
          {NAV.map((n) => <Link key={n.href} href={n.href} onClick={() => setMenu(false)} className="block py-3 font-semibold">{n.label}</Link>)}
        </nav>
      )}
    </header>
  );
}
