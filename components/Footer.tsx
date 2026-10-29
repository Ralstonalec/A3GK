import Link from 'next/link';
import { HANDLES, POLICIES } from '@/lib/content';
import { Tbc } from './Tbc';

export function Footer() {
  return (
    <footer className="bg-charcoal-900 text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-extrabold text-white">A3GK</p>
          <p className="mt-2 text-sm">A3 Goalkeeping</p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white">Shop</p>
          <ul className="space-y-2 text-sm">
            <li><Link href={`/products/${HANDLES.base}`}>Padded Base Layer</Link></li>
            <li><Link href={`/products/${HANDLES.longTop}`}>Long-Sleeve Top</Link></li>
            <li><Link href={`/products/${HANDLES.shortTop}`}>Short-Sleeve Top</Link></li>
            <li><Link href={`/products/${HANDLES.leggings}`}>Leggings</Link></li>
            <li><Link href={`/products/${HANDLES.shorts}`}>Shorts</Link></li>
            <li><Link href={`/products/${HANDLES.socks}`}>Grip Socks</Link></li>
            <li><Link href={`/products/${HANDLES.bandages}`}>Sports Bandages</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white">Help</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/help#contact">Contact</Link></li>
            <li><Link href="/help#shipping">Shipping information</Link></li>
            <li><Link href="/help#returns">Returns policy</Link></li>
            <li><Link href="/size-guide">Size guide</Link></li>
            <li><Link href="/club">A3 Goalkeepers Club</Link></li>
            <li><Link href="/membership">Membership</Link></li>
            <li><Link href="/help#care">Product care</Link></li>
            <li>{POLICIES.privacyUrl ? <a href={POLICIES.privacyUrl}>Privacy policy</a> : <Tbc label="Privacy policy" />}</li>
            <li>{POLICIES.termsUrl ? <a href={POLICIES.termsUrl}>Terms of service</a> : <Tbc label="Terms of service" />}</li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white">Follow</p>
          {POLICIES.social.length ? (
            <ul className="space-y-2 text-sm">{POLICIES.social.map((s) => <li key={s.href}><a href={s.href} rel="noopener noreferrer">{s.label}</a></li>)}</ul>
          ) : <Tbc label="Social media links (genuine accounts only)" />}
        </div>
      </div>
      <p className="border-t border-white/10 py-5 text-center text-xs">© {new Date().getFullYear()} A3 Goalkeeping</p>
    </footer>
  );
}
