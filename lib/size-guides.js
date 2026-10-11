import sizes from '../data/sizes.json';
import futureGloves from '../data/future/gloves.json';
import { FEATURES } from './features';

/**
 * Size charts are factual claims about real garments, so none ship by default
 * (data/sizes.json). A guide exists only when it has rows; the "Size guide" link
 * appears automatically once you add one and is hidden until then.
 */
export function getSizeGuide(kind) {
  const guide = kind === 'gloves' && FEATURES.gloves ? futureGloves.sizeGuide : sizes[kind];
  return guide && Array.isArray(guide.rows) && guide.rows.length > 0 ? guide : null;
}

export function guideKindFor(product) {
  if (product.category === 'gloves') return 'gloves';
  if (product.productType === 'Socks') return 'socks';
  return 'apparel';
}

/** Does this product have a size option AND a real chart to show? */
export function hasSizeGuide(product) {
  return product.options.some((o) => o.name.toLowerCase() === 'size') && Boolean(getSizeGuide(guideKindFor(product)));
}
