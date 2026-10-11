import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import Seo from '@/components/layout/Seo';
import ProductCard from '@/components/commerce/ProductCard';
import ProductFilters from '@/components/commerce/ProductFilters';
import QuickViewModal from '@/components/commerce/QuickViewModal';
import StaggeredList from '@/components/animation/StaggeredList';
import { apiUrl, CATEGORIES, PRICE_RANGES, SITE } from '@/lib/config';
import { getProducts } from '@/lib/products';
import { buildProductQuery } from '@/lib/search-syntax';
import styles from '@/styles/pages.module.css';

export async function getStaticProps() {
  return { props: { initial: await getProducts({ first: 50, sort: 'featured' }) }, revalidate: 120 };
}

const SORTS = ['featured', 'newest', 'price-asc', 'price-desc', 'title'];

function readFilters(query) {
  const one = (v) => (Array.isArray(v) ? v[0] : v);
  const category = one(query.category);
  const price = one(query.price);
  const sort = one(query.sort);
  return {
    q: one(query.q) || '',
    category: CATEGORIES.some((c) => c.id === category) ? category : 'all',
    price: PRICE_RANGES.some((p) => p.id === price) ? price : 'any',
    tags: (one(query.tags) || '').split(',').filter(Boolean),
    available: one(query.available) === '1',
    sort: SORTS.includes(sort) ? sort : 'featured',
  };
}

function toShopifyQuery(filters) {
  const category = CATEGORIES.find((c) => c.id === filters.category);
  const range = PRICE_RANGES.find((p) => p.id === filters.price);
  return buildProductQuery({
    text: filters.q,
    productTypes: category?.productTypes || [],
    tags: filters.tags,
    minPrice: range?.min,
    maxPrice: range?.max,
    availableOnly: filters.available,
  });
}

const fetcher = (url) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Could not load products');
    return r.json();
  });

export default function Catalog({ initial }) {
  const router = useRouter();
  const [quick, setQuick] = useState(null);
  const filters = useMemo(() => readFilters(router.query), [router.query]);
  const query = useMemo(() => toShopifyQuery(filters), [filters]);

  // Unfiltered + default sort is served from the static page; everything else asks /api/products.
  const isDefault = query === '' && filters.sort === 'featured';
  const key = router.isReady && !isDefault ? apiUrl(`/products?first=50&sort=${filters.sort}&query=${encodeURIComponent(query)}`) : null;
  const { data, error, isLoading } = useSWR(key, fetcher, { keepPreviousData: true, revalidateOnFocus: false });
  const products = isDefault || !data ? initial : data.products;

  const update = useCallback(
    (changes) => {
      const next = { ...filters, ...changes };
      const params = new URLSearchParams();
      if (next.q) params.set('q', next.q);
      if (next.category !== 'all') params.set('category', next.category);
      if (next.price !== 'any') params.set('price', next.price);
      if (next.tags.length) params.set('tags', next.tags.join(','));
      if (next.available) params.set('available', '1');
      if (next.sort !== 'featured') params.set('sort', next.sort);
      const qs = params.toString();
      router.replace(qs ? `/products?${qs}` : '/products', undefined, { shallow: true, scroll: false });
    },
    [filters, router],
  );

  const title = filters.category !== 'all' ? CATEGORIES.find((c) => c.id === filters.category).label : 'All gear';

  return (
    <>
      <Seo title={title} description={SITE.description} path="/products" />
      <div className={`page-width ${styles.catalog}`}>
        <header className={styles.pageHeader}>
          <p className="eyebrow">Shop</p>
          <h1>{title}</h1>
        </header>

        <div className={styles.catalogLayout}>
          <ProductFilters
            filters={filters}
            onChange={update}
            onReset={() => router.replace('/products', undefined, { shallow: true, scroll: false })}
            resultCount={products.length}
            queryString={query}
          />
          <div aria-busy={isLoading} className={styles.catalogResults}>
            {error && (
              <p role="alert" className={styles.empty}>
                We could not apply those filters. Please try again.
              </p>
            )}
            {products.length === 0 && !error ? (
              <div className={styles.empty}>
                <p className="h3">No gear matches those filters</p>
                <p className="muted">Try removing a filter or searching for something else.</p>
              </div>
            ) : (
              <StaggeredList key={query + filters.sort} as="ul" itemAs="li" className="grid grid--2-col-mobile grid--3-col-tablet grid--3-col-desktop" role="list">
                {products.map((p, i) => (
                  <ProductCard key={p.handle} product={p} onQuickView={setQuick} priority={i < 3} sizes="(min-width: 990px) 28vw, (min-width: 750px) 33vw, 50vw" />
                ))}
              </StaggeredList>
            )}
          </div>
        </div>
      </div>
      <QuickViewModal product={quick} onClose={() => setQuick(null)} />
    </>
  );
}
