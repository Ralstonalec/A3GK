import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Accordion } from '@/components/Accordion';
import { Viewer3D } from '@/components/Viewer3D';
import { PhotoSlot } from '@/components/PhotoSlot';
import { ProductCard } from '@/components/ProductCard';
import { PurchasePanel } from '@/components/PurchasePanel';
import { Fact, Tbc } from '@/components/Tbc';
import { BASE_LAYER, FAQ, HANDLES, POLICIES, SIZE_GUIDE } from '@/lib/content';
import { getProduct } from '@/lib/shopify';

export const generateStaticParams = () => Object.values(HANDLES).map((handle) => ({ handle }));
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: { handle: string } }): Promise<Metadata> {
  const p = await getProduct(params.handle);
  return p ? { title: p.title } : {};
}

const GALLERY_SLOTS = ['Flat lay (supplied)', '3D viewer', 'Back view', 'Side view', 'Padding close-ups', 'Fabric and seam details', 'Worn on a person', 'Colour options', 'Short product video'];

export default async function ProductPage({ params }: { params: { handle: string } }) {
  const product = await getProduct(params.handle);
  if (!product) notFound();
  const isBase = product.handle === HANDLES.base;
  const [socks, bandages] = isBase ? await Promise.all([getProduct(HANDLES.socks), getProduct(HANDLES.bandages)]) : [null, null];

  const info = isBase
    ? [
        { title: 'Product details', body: <ul className="space-y-1"><li>Garment: <Fact value={BASE_LAYER.garmentType} label="Garment type" /></li><li>Included: <Fact value={BASE_LAYER.included} label="What is included" /></li><li>Padding: <Fact value={BASE_LAYER.paddingSpec} label="Padding specification" /></li><li>Origin: <Fact value={BASE_LAYER.origin} label="Origin (only if verified)" /></li></ul> },
        { title: 'Size and fit', body: <><p><Fact value={BASE_LAYER.intendedFit} label="Intended fit" /></p><Link href="/size-guide" className="mt-2 inline-block font-semibold underline underline-offset-4">Full size guide</Link></> },
        { title: 'Materials and care', body: <ul className="space-y-1"><li>Fabric: <Fact value={BASE_LAYER.fabricComposition} label="Fabric composition" /></li><li>Care: <Fact value={BASE_LAYER.care} label="Care instructions" /></li></ul> },
        { title: 'Shipping', body: <Fact value={POLICIES.deliveryEstimate} label="Delivery estimates by destination" /> },
        { title: 'Returns', body: <Fact value={POLICIES.sizeExchanges} label="Returns and exchange terms" /> },
        { title: 'Frequently asked questions', body: <dl className="space-y-3">{FAQ.map((f) => <div key={f.q}><dt className="font-semibold">{f.q}</dt><dd>{f.a ?? <Tbc label={f.tbc} />}</dd></div>)}</dl> },
      ]
    : [
        { title: 'Product details', body: product.descriptionHtml ? <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} /> : <Tbc label="Product description" /> },
        { title: 'Shipping', body: <Fact value={POLICIES.deliveryEstimate} label="Delivery estimates by destination" /> },
        { title: 'Returns', body: <Fact value={POLICIES.sizeExchanges} label="Returns and exchange terms" /> },
      ];

  return (
    <div className="section">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-white/55"><Link href="/">Home</Link> / {product.title}</nav>
      <div className="grid gap-10 md:grid-cols-[1.2fr_1fr]">
        <div>
          {product.images.length ? (
            <ul className="grid grid-cols-2 gap-3">
              {product.images.map((img, i) => (
                <li key={img.url} className={`relative aspect-square bg-white/[0.06] ${i === 0 ? 'col-span-2' : ''}`}>
                  <Image src={img.url} alt={img.altText ?? `${product.title} image ${i + 1}`} fill sizes="(min-width:768px) 40vw, 100vw" className="object-cover" priority={i === 0} />
                </li>
              ))}
            </ul>
          ) : isBase ? (
            <ul className="grid grid-cols-2 gap-3">{GALLERY_SLOTS.map((s, i) => <li key={s} className={i <= 1 ? 'col-span-2' : ''}>{i === 1 ? <Viewer3D /> : i === 0 ? <Image src="/images/base-layer-hero.webp" alt="A3GK padded base layer top and leggings laid flat" width={1125} height={2000} priority sizes="(min-width:768px) 50vw, 100vw" className="mx-auto max-h-[720px] w-auto" /> : <PhotoSlot label={s} className="min-h-[180px]" />}</li>)}</ul>
          ) : <PhotoSlot label="Product photographs" className="min-h-[360px]" />}
          {isBase && <p className="mt-3 text-sm text-white/55">Outer kit shown in photos is not included unless stated under “What you receive”.</p>}
        </div>

        <div className="md:sticky md:top-24 md:self-start">
          <PurchasePanel product={product} sizeGuide={isBase} />
          {isBase && (
            <div className="mt-6 border-l-4 border-white/60 bg-white/[0.06] p-4 text-sm">
              <p className="font-bold">Before you buy</p>
              <ul className="mt-1 space-y-1">
                <li>Sizing: {SIZE_GUIDE.measurementType ? 'see size guide' : <Tbc label="Sizing basis" />}</li>
                <li>Delivery: <Fact value={POLICIES.deliveryEstimate} label="Delivery estimate" /></li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-14 max-w-3xl"><Accordion items={info} /></div>

      {isBase && (
        <section className="mt-16" aria-labelledby="kit">
          <h2 id="kit" className="font-display text-2xl font-bold uppercase">Complete your kit</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {socks && <ProductCard product={socks} />}
            {bandages && <ProductCard product={bandages} />}
          </div>
        </section>
      )}
    </div>
  );
}
