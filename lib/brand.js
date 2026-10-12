import brand from '../data/brand.json';

/**
 * Brand identity (data/brand.json, written by `npm run brand`).
 * `hasLogo` is false until a real logo has been supplied; the header and
 * footer then fall back to a plain text wordmark. `lockup` is the optional full
 * logo (symbol + name) used larger in the footer.
 */
export const BRAND = {
  name: brand.name,
  logo: brand.logo,
  lockup: brand.lockup,
  mark: brand.mark,
  iconSvg: Boolean(brand.iconSvg),
  hasLogo: Boolean(brand.logo?.src),
};
