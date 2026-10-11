import { publicConfig } from '@/lib/config';

export async function getServerSideProps({ res }) {
  const base = publicConfig.siteUrl.replace(/\/$/, '');
  const isPreview = Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== 'production';
  const body = isPreview
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /cart\n\nSitemap: ${base}/sitemap.xml\n`;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(body);
  res.end();
  return { props: {} };
}

export default function Robots() {
  return null;
}
