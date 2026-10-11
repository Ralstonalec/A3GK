import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Seo from '@/components/layout/Seo';
import AddToCartButton from '@/components/commerce/AddToCartButton';
import Price from '@/components/commerce/Price';
import ProductCard from '@/components/commerce/ProductCard';
import ProductGallery from '@/components/commerce/ProductGallery';
import QuantitySelector from '@/components/commerce/QuantitySelector';
import SizeGuideModal from '@/components/commerce/SizeGuideModal';
import TrustBadges from '@/components/commerce/TrustBadges';
import VariantSelector, { useVariantSelection } from '@/components/commerce/VariantSelector';
import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import { IconArrow } from '@/components/ui/Icons';
import { publicConfig } from '@/lib/config';
import { CART_LIMITS, hasFreeShipping, hasReturnWindow, STORE_TERMS } from '@/lib/store-terms';
import { toItem, track } from '@/lib/analytics';
import { getProduct, getProductHandles, getProducts } from '@/lib/products';
import { formatMoney } from '@/lib/utils';
import styles from '@/styles/pages.module.css';

export async function getStaticPaths() {
  const handles = await getProductHandles();
  return { paths: handles.map((handle) => ({ params: { handle } })), fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const product = await getProduct(params.handle);
  if (!product) return { notFound: true, revalidate: 30 };
  const all = await getProducts({ first: 12 });
  const related = all
    .filter((p) => p.handle !== product.handle)
    .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
    .slice(0, 4);
  return { props: { product, related }, revalidate: 60 };
}

function productJsonLd(product, base) {
  const prices = product.variants.map((v) => v.priceCents / 100);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.images.map((i) => (i.url.startsWith('http') ? i.url : `${base}${i.url}`)),
    brand: { '@type': 'Brand', name: product.vendor || 'A3GK' },
    sku: product.variants[0]?.sku,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: product.currencyCode,
      lowPrice: Math.min(...prices).toFixed(2),
      highPrice: Math.max(...prices).toFixed(2),
      offerCount: product.variants.length,
      availability: product.availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${base}/products/${product.handle}`,
    },
  };
}

export default function ProductPage({ product, related }) {
  const selection = useVariantSelection(product);
  const { variant } = selection;
  const [requestedQty, setQuantity] = useState(1);
  const [guide, setGuide] = useState(false);
  const base = publicConfig.siteUrl.replace(/\/$/, '');
  const guideKind = product.category === 'gloves' ? 'gloves' : 'apparel';
  const hasSizes = product.options.some((o) => o.name.toLowerCase() === 'size');

  useEffect(() => {
    track('view_item', { currency: product.currencyCode, value: product.priceRange.minCents / 100, items: [toItem(product, variant)] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.handle]);

  const maxQty = Math.max(1, Math.min(CART_LIMITS.maxLineQuantity, variant?.quantityAvailable ?? CART_LIMITS.maxLineQuantity));

  // Derived, not synced: always within the selected variant's stock.
  const quantity = Math.max(1, Math.min(requestedQty, maxQty));

  const accordion = useMemo(() => {
    const items = [
      {
        id: 'description',
        title: 'Description',
        // Sanitised with DOMPurify on the server in lib/products.js before it reaches the page.
        content: <div className="rte" dangerouslySetInnerHTML={{ __html: product.descriptionHtml || '' }} />,
      },
    ];
    if (product.features.length) {
      items.push({
        id: 'features',
        title: 'Features',
        content: (
          <ul className={styles.featureList}>
            {product.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        ),
      });
    }
    if (product.specs.length) {
      items.push({
        id: 'specs',
        title: 'Specifications',
        content: (
          <dl className={styles.specs}>
            {product.specs.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        ),
      });
    }
    // Buying terms appear only once they are decided and set in lib/store-terms.js.
    const termLines = [];
    if (hasFreeShipping()) termLines.push(`Free shipping over ${formatMoney(STORE_TERMS.freeShippingThresholdCents, { trimZeros: true })}.`);
    if (hasReturnWindow() && !product.customizable) termLines.push(`Return unworn items within ${STORE_TERMS.returnWindowDays} days.`);
    if (termLines.length) items.push({ id: 'shipping', title: 'Shipping & returns', content: <p>{termLines.join(' ')}</p> });
    return items;
  }, [product]);

  return (
    <>
      <Seo
        title={product.seo.title}
        description={product.seo.description || product.description}
        path={`/products/${product.handle}`}
        image={product.images[0]?.url}
        type="product"
        jsonLd={productJsonLd(product, base)}
      />
      <div className={`page-width ${styles.pdp}`}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <ol role="list">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/products">Shop</Link>
            </li>
            <li>
              <Link href={`/products?category=${product.category}`}>{product.productType}</Link>
            </li>
            <li aria-current="page">{product.title}</li>
          </ol>
        </nav>

        <div className={styles.pdpGrid}>
          <ProductGallery product={product} />

          <div className={styles.pdpInfo}>
            <p className="eyebrow">{product.productType}</p>
            <h1 className={styles.pdpTitle}>{product.title}</h1>
            <Price cents={variant?.priceCents ?? product.priceRange.minCents} compareAtCents={variant?.compareAtPriceCents ?? product.compareAtMinCents} size="lg" />
            <p className="lead">{product.description}</p>

            <VariantSelector product={product} {...selection} onOpenSizeGuide={hasSizes ? () => setGuide(true) : undefined} />

            {product.customizable ? (
              <div className="stack">
                <Button href="/customizer" size="lg" fullWidth iconAfter={<IconArrow size={20} />}>
                  Design yours in the studio
                </Button>
                <p className="muted">Pick colours, pattern, name, number and logo — with live pricing. From {formatMoney(product.priceRange.minCents)}.</p>
              </div>
            ) : (
              <div className="stack">
                <div className={styles.qtyRow}>
                  <span className={styles.qtyLabel}>Quantity</span>
                  <QuantitySelector value={quantity} onChange={setQuantity} max={maxQty} label={product.title} disabled={!variant?.availableForSale} />
                </div>
                <AddToCartButton product={product} variant={variant} quantity={quantity} />
              </div>
            )}

            <TrustBadges compact />
            <Accordion items={accordion} defaultOpen={[0]} />
          </div>
        </div>

        {related.length > 0 && (
          <section className={styles.related} aria-labelledby="related-heading">
            <h2 id="related-heading" className="h2">
              You may also need
            </h2>
            <ul role="list" className="grid grid--2-col-mobile grid--4-col-desktop">
              {related.map((p) => (
                <li key={p.handle} className="grid__item">
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      {hasSizes && <SizeGuideModal open={guide} onClose={() => setGuide(false)} kind={guideKind} activeSize={selection.selected.Size} />}
    </>
  );
}
