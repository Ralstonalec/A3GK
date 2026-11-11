import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/content';

/** Search engines may read the shop pages; account, sign-in and API routes are kept out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/account', '/auth/', '/customer/', '/login', '/unsubscribe'] }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
