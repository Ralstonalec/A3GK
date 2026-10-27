import Link from 'next/link';
import Image from 'next/image';
import { formatMoney } from '@/lib/format';
import type { Product } from '@/lib/types';
import { Tbc } from './Tbc';

export function ProductCard({ product }: { product: Product }) {
  const price = product.variants[0]?.price;
  const img = product.images[0];
  return (
    <Link href={`/products/${product.handle}`} className="group flex gap-4 border border-white/15 bg-white/[0.06] p-3 transition hover:border-white/60">
      <div className="relative h-24 w-24 shrink-0 bg-charcoal-900 text-white">
        {img ? <Image src={img.url} alt={img.altText ?? product.title} fill sizes="96px" className="object-cover" />
          : <span className="absolute inset-0 flex items-center justify-center p-2 text-center text-[10px] font-semibold text-white/55">Photo to be added</span>}
      </div>
      <div className="flex flex-col justify-center">
        <p className="font-semibold">{product.title}</p>
        <p className="text-sm">{price ? formatMoney(price.amount, price.currencyCode) : <Tbc label="Price" />}</p>
        <p className="mt-1 text-sm font-semibold underline underline-offset-4 group-hover:no-underline">View details</p>
      </div>
    </Link>
  );
}
