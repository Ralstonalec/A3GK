import Image from 'next/image';
import Link from 'next/link';
import { CurrencySwitch } from './CurrencySwitch';
import { HANDLES, POLICIES } from '@/lib/content';
import { Tbc } from './Tbc';
import { productExists } from '@/lib/shopify';

export async function Footer() {
  // Grip socks and bandages are only linked once they are active in Shopify; a draft product has no page.
  const [hasSocks, hasBandages] = await Promise.all([productExists(HANDLES.socks), productExists(HANDLES.bandages)]);
  return (
    <footer className="bg-charcoal-900 text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <Image src="/brand/a3gk-logo-white.png" alt="A3GK" width={738} height={757} className="h-32 w-auto drop-shadow-[0_0_24px_rgba(255,255,255,0.18)] md:h-40" />
          <p className="mt-3 text-sm">A3 Goalkeeping</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Shop</p>
          <ul className="space-y-2 text-sm">
            <li><Link href={`/products/${HANDLES.base}`}>Padded Base Layer</Link></li>
            <li><Link href={`/products/${HANDLES.longTop}`}>Long-Sleeve Top</Link></li>
            <li><Link href={`/products/${HANDLES.shortTop}`}>Short-Sleeve Top</Link></li>
            <li><Link href={`/products/${HANDLES.leggings}`}>Leggings</Link></li>
            <li><Link href={`/products/${HANDLES.shorts}`}>Shorts</Link></li>
            {hasSocks && <li><Link href={`/products/${HANDLES.socks}`}>Grip Socks</Link></li>}
            {hasBandages && <li><Link href={`/products/${HANDLES.bandages}`}>Sports Bandages</Link></li>}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Help</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/help#contact">Contact</Link></li>
            <li><Link href="/help#shipping">Shipping information</Link></li>
            <li><Link href="/track">Track your order</Link></li>
            <li><Link href="/help#returns">Returns policy</Link></li>
            <li><Link href="/size-guide">Size guide</Link></li>
            <li><Link href="/team">Team orders</Link></li>
            <li><Link href="/club">A3 Goalkeepers Club</Link></li>
            <li><Link href="/membership">Membership</Link></li>
            <li><Link href="/help#care">Product care</Link></li>
            <li>{POLICIES.privacyUrl ? <Link href={POLICIES.privacyUrl}>Privacy policy</Link> : <Tbc label="Privacy policy" />}</li>
            <li>{POLICIES.termsUrl ? <Link href={POLICIES.termsUrl}>Terms of sale</Link> : <Tbc label="Terms of sale" />}</li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Follow</p>
          {POLICIES.social.length ? (
            <ul className="space-y-2 text-sm">{POLICIES.social.map((s) => <li key={s.href}><a href={s.href} rel="noopener noreferrer">{s.label}</a></li>)}</ul>
          ) : <Tbc label="Social media links (genuine accounts only)" />}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 border-t border-white/10 py-5 text-xs"><p>© {new Date().getFullYear()} A3 Goalkeeping</p><div className="lg:hidden"><CurrencySwitch /></div></div>
    </footer>
  );
}
