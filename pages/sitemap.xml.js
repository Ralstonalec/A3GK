import { publicConfig } from '@/lib/config';
import { FEATURES } from '@/lib/features';
import { getProductHandles } from '@/lib/products';

const STATIC = ['', '/products', ...(FEATURES.customKit ? ['/customizer'] : []), '/privacy', '/terms'];

export async function getServerSideProps({ res }) {
  const base = publicConfig.siteUrl.replace(/\/$/, '');
  const handles = await getProductHandles();
  const urls = [...STATIC, ...handles.map((h) => `/products/${h}`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n')}
</urlset>`;
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml);
  res.end();
  return { props: {} };
}

export default function Sitemap() {
  return null;
}
