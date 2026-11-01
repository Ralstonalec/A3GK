'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NAV } from '@/lib/content';
import { useCart } from '@/lib/cart-context';
import { supabaseConfigured } from '@/lib/supabase/env';

export function Header() {
  const { cart, setOpen } = useCart();
  const [menu, setMenu] = useState(false);
  const count = cart?.totalQuantity ?? 0;
  const home = usePathname() === '/';
  const [past, setPast] = useState(false);
  useEffect(() => {
    if (!home) return;
    const on = () => setPast(window.scrollY > window.innerHeight * 0.7);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [home]);
  const showLogo = !home || past;
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#080a0e] via-[#080a0e]/85 to-transparent md:hidden" />
      <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        <Link href="/" className={`flex items-center gap-2.5 font-display text-3xl font-extrabold tracking-tight transition-opacity duration-300 sm:gap-3 sm:text-4xl ${showLogo ? 'opacity-100' : 'invisible opacity-0'}`} aria-label="A3GK home">
          <Image src="/brand/a3gk-logo-white.png" alt="" width={738} height={757} priority className="h-14 w-auto drop-shadow-[0_0_14px_rgba(255,255,255,0.3)] sm:h-16" />
          <span className="sr-only">A3GK</span>
        </Link>
        <nav aria-label="Main" className="glass hidden items-center gap-1 rounded-full p-1.5 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-accent hover:text-ink">{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {supabaseConfigured && (
            <Link href="/login" className="glass flex h-12 w-12 items-center justify-center rounded-full" aria-label="Account">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></svg>
            </Link>
          )}
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
