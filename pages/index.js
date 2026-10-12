import Seo from '@/components/layout/Seo';
import HeroSection from '@/components/sections/HeroSection';
import CategoryGrid from '@/components/sections/CategoryGrid';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import ProductSpotlight from '@/components/sections/ProductSpotlight';
import TechnologyShowcase from '@/components/sections/TechnologyShowcase';
import Viewer360Section from '@/components/sections/Viewer360Section';
import CustomizerTeaser from '@/components/sections/CustomizerTeaser';
import StatsSection from '@/components/sections/StatsSection';
import TestimonialCarousel from '@/components/sections/TestimonialCarousel';
import SocialFeed from '@/components/sections/SocialFeed';
import FaqSection, { faqJsonLd } from '@/components/sections/FaqSection';
import Section from '@/components/layout/Section';
import TrustBadges, { getTrustBadges } from '@/components/commerce/TrustBadges';
import { publicConfig, SITE } from '@/lib/config';
import { getProducts } from '@/lib/products';
import { getSocialPosts } from '@/lib/social';

export async function getStaticProps() {
  const [products, social] = await Promise.all([getProducts({ first: 5, sort: 'featured' }), getSocialPosts()]);
  // First product gets the spotlight; the next four fill the grid (no product appears twice).
  return { props: { spotlight: products[0] || null, featured: products.slice(1, 5), posts: social.posts }, revalidate: 300 };
}

export default function Home({ spotlight, featured, posts }) {
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
            ...(sameAs.length ? { sameAs } : {}),
          },
          { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: base },
          faqJsonLd,
        ].filter(Boolean)}
      />
      <HeroSection />
      <CategoryGrid />
      <ProductSpotlight product={spotlight} />
      <FeaturedProducts products={featured} eyebrow="More gear" heading="Featured gear" />
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
