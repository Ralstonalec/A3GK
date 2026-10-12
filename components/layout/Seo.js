import Head from 'next/head';
import { isDemoCatalogue, publicConfig, SITE } from '@/lib/config';

/**
 * Per-page <head>: title, description, canonical, Open Graph / Twitter, JSON-LD.
 * @param {{ title?: string, description?: string, path?: string, image?: string, type?: string, noindex?: boolean, jsonLd?: object|object[] }} props
 */
export default function Seo({ title, description = SITE.description, path = '/', image = '/images/og.png', type = 'website', noindex = false, jsonLd }) {
  const fullTitle = title ? `${title} | ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
  const base = publicConfig.siteUrl.replace(/\/$/, '');
  const url = `${base}${path === '/' ? '' : path}`;
  const imageUrl = image.startsWith('http') ? image : `${base}${image}`;
  const blocks = jsonLd ? [].concat(jsonLd) : [];

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url || base} />
      {/* While the placeholder catalogue is live (no Shopify store connected) nothing should be indexed. */}
      {(noindex || isDemoCatalogue()) && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url || base} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          // JSON-LD is data, not executed; escape `<` so a product title can never close the tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block).replace(/</g, '\\u003c') }}
        />
      ))}
    </Head>
  );
}
