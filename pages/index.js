import Seo from '@/components/layout/Seo';
import HeroSection from '@/components/sections/HeroSection';
import CategoryGrid from '@/components/sections/CategoryGrid';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import TechnologyShowcase from '@/components/sections/TechnologyShowcase';
import Viewer360Section from '@/components/sections/Viewer360Section';
import CustomizerTeaser from '@/components/sections/CustomizerTeaser';
import StatsSection from '@/components/sections/StatsSection';
import TestimonialCarousel from '@/components/sections/TestimonialCarousel';
import SocialFeed from '@/components/sections/SocialFeed';
import FaqSection, { faqJsonLd } from '@/components/sections/FaqSection';
import Section from '@/components/layout/Section';
import TrustBadges, { getTrustBadges } from '@/components/commerce/TrustBadges';
import { BRAND } from '@/lib/brand';
import { publicConfig, SITE } from '@/lib/config';
import { getProducts } from '@/lib/products';
import { getSocialPosts } from '@/lib/social';

export async function getStaticProps() {
  const [products, social] = await Promise.all([getProducts({ first: 4, sort: 'featured' }), getSocialPosts()]);
  return { props: { featured: products.slice(0, 4), posts: social.posts }, revalidate: 300 };
}

export default function Home({ featured, posts }) {
  const base = publicConfig.siteUrl.replace(/\/$/, '');
  const sameAs = Object.values(SITE.social).filter(Boolean);
  return (
    <>
      <Seo
        path="/"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: SITE.name,
            url: base,
            // Only a real, supplied logo is published as the organisation logo.
            ...(BRAND.hasLogo && !BRAND.logo.src.endsWith('.svg') ? { logo: `${base}${BRAND.logo.src}` } : {}),
            ...(sameAs.length ? { sameAs } : {}),
          },
          { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: base },
          faqJsonLd,
        ].filter(Boolean)}
      />
      <HeroSection />
      <CategoryGrid />
      <FeaturedProducts products={featured} />
      <TechnologyShowcase />
      <Viewer360Section />
      <CustomizerTeaser />
      <StatsSection />
      <TestimonialCarousel />
      <SocialFeed posts={posts} />
      {getTrustBadges().length > 0 && (
        <Section id="trust" type="trust-badges" settings={{ heading: 'Shop with confidence' }} tight>
          <div className="page-width">
            <TrustBadges />
          </div>
        </Section>
      )}
      <FaqSection />
    </>
  );
}
