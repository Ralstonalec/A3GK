import type { MetadataRoute } from 'next';
import { HANDLES, SITE } from '@/lib/content';
import { productExists } from '@/lib/shopify';

/** Public pages only. A product is listed only when its page exists, so drafts in Shopify are left out. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pieces = [HANDLES.longTop, HANDLES.shortTop, HANDLES.leggings, HANDLES.shorts, HANDLES.socks, HANDLES.bandages];
  const live = (await Promise.all(pieces.map(async (h) => ((await productExists(h)) ? h : null)))).filter((h): h is NonNullable<typeof h> => Boolean(h));
  const paths = ['/', `/products/${HANDLES.base}`, ...live.map((h) => `/products/${h}`), '/size-guide', '/help', '/team', '/club', '/membership', '/about', '/track', '/privacy', '/terms'];
  return paths.map((p) => ({ url: `${SITE.url}${p === '/' ? '' : p}`, priority: p === '/' || p === `/products/${HANDLES.base}` ? 1 : 0.6 }));
}
