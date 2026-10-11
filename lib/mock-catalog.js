import raw from '../data/products.json';
import futureCustomKit from '../data/future/custom-kit.json';
import futureGloves from '../data/future/gloves.json';
import { FEATURES } from './features';
import { filterProducts } from './search-syntax';

/**
 * Demo-mode catalogue.  Expands the compact data/products.json into the same
 * normalised shape lib/shopify.js produces from the Storefront API, so every
 * page and API route is source-agnostic.
 */

const IMAGE_BASE = '/images/products';

function cartesian(options) {
  return options.reduce(
    (acc, option) => acc.flatMap((combo) => option.values.map((value) => [...combo, { name: option.name, value }])),
    [[]],
  );
}

/** Stock for a variant. `null` means "not tracked": available, but no quantity is asserted. */
function stockFor(selected, stock) {
  const matches = selected
    .map((s) => stock.overrides?.[`${s.name}:${s.value}`])
    .filter((v) => typeof v === 'number');
  if (matches.length) return Math.min(...matches);
  return typeof stock.default === 'number' ? stock.default : null;
}

/** Launch range + whatever is switched on in lib/features.js. */
function sourceProducts() {
  return [...raw.products, ...(FEATURES.gloves ? futureGloves.products : []), ...(FEATURES.customKit ? futureCustomKit.products : [])];
}

function expandProduct(p) {
  const priceCents = Math.round(p.price * 100);
  const compareAtCents = p.compareAtPrice ? Math.round(p.compareAtPrice * 100) : null;

  const variants = cartesian(p.options).map((selectedOptions, index) => {
    const quantityAvailable = stockFor(selectedOptions, p.stock);
    return {
      id: `gid://shopify/ProductVariant/${p.id}${String(index + 1).padStart(2, '0')}`,
      title: selectedOptions.map((s) => s.value).join(' / '),
      sku: `A3-${p.id}-${String(index + 1).padStart(2, '0')}`,
      priceCents,
      compareAtPriceCents: compareAtCents,
      availableForSale: quantityAvailable === null ? true : quantityAvailable > 0,
      quantityAvailable,
      selectedOptions,
    };
  });

  const images = p.images.map((img) => ({
    url: `${IMAGE_BASE}/${img.file}.webp`,
    altText: img.alt,
    width: 1200,
    height: 1200,
  }));

  return {
    id: `gid://shopify/Product/${p.id}`,
    handle: p.handle,
    title: p.title,
    description: p.description,
    descriptionHtml: p.descriptionHtml,
    vendor: 'A3GK',
    productType: p.productType,
    category: p.category,
    tags: p.tags,
    badges: p.badges || [],
    availableForSale: variants.some((v) => v.availableForSale),
    currencyCode: 'USD',
    priceRange: { minCents: priceCents, maxCents: priceCents },
    compareAtMinCents: compareAtCents,
    featuredImage: images[0],
    images,
    options: p.options,
    variants,
    model: p.model || null,
    viewer360: p.viewer360 || null,
    customizable: Boolean(p.customizable),
    leadTimeDays: p.leadTimeDays || 0,
    features: p.features || [],
    specs: p.specs || [],
    seo: { title: p.title, description: p.description },
    createdOrder: p.id,
  };
}

let cache;
export function getMockProducts() {
  if (!cache) cache = sourceProducts().map(expandProduct);
  return cache;
}

const SORTERS = {
  featured: null,
  'price-asc': (a, b) => a.priceRange.minCents - b.priceRange.minCents,
  'price-desc': (a, b) => b.priceRange.minCents - a.priceRange.minCents,
  newest: (a, b) => b.createdOrder - a.createdOrder,
  title: (a, b) => a.title.localeCompare(b.title),
};

/**
 * @param {{ query?: string, first?: number, sort?: keyof typeof SORTERS }} [opts]
 */
export function queryMockProducts({ query = '', first = 24, sort = 'featured' } = {}) {
  let list = filterProducts(getMockProducts(), query);
  const sorter = SORTERS[sort];
  if (sorter) list = [...list].sort(sorter);
  return list.slice(0, first);
}

export function getMockProduct(handle) {
  return getMockProducts().find((p) => p.handle === handle) || null;
}

export function getMockVariant(variantId) {
  for (const product of getMockProducts()) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}
