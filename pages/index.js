import social from '@/data/social.json';
import Seo from '@/components/layout/Seo';
import HeroSection from '@/components/sections/HeroSection';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import TechnologyShowcase from '@/components/sections/TechnologyShowcase';
import Viewer360Section from '@/components/sections/Viewer360Section';
import CustomizerTeaser from '@/components/sections/CustomizerTeaser';
import StatsSection from '@/components/sections/StatsSection';
import TestimonialCarousel from '@/components/sections/TestimonialCarousel';
import SocialFeed from '@/components/sections/SocialFeed';
import FaqSection, { faqJsonLd } from '@/components/sections/FaqSection';
import Section from '@/components/layout/Section';
import TrustBadges from '@/components/commerce/TrustBadges';
import { publicConfig, SITE } from '@/lib/config';
import { getProducts } from '@/lib/products';

export async function getStaticProps() {
  const products = await getProducts({ first: 8, sort: 'featured' });
  // Lead with proven sellers, keep the customizable product visible.
  const featured = [...products].sort((a, b) => Number(b.tags.includes('bestseller')) - Number(a.tags.includes('bestseller'))).slice(0, 4);
  return { props: { featured, socialFallback: { source: 'sample', isSample: social.isSample, posts: social.posts } }, revalidate: 300 };
}

export default function Home({ featured, socialFallback }) {
  const base = publicConfig.siteUrl.replace(/\/$/, '');
  return (
    <>
      <Seo
        path="/"
        jsonLd={[
          { '@context': 'https://schema.org', '@type': 'Organization', name: SITE.legalName, url: base, logo: `${base}/icons/icon-512.png`, sameAs: Object.values(SITE.social) },
          { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: base },
          faqJsonLd,
        ]}
      />
      <HeroSection />
      <FeaturedProducts products={featured} />
      <TechnologyShowcase />
      <Viewer360Section />
      <CustomizerTeaser />
      <StatsSection />
      <TestimonialCarousel />
      <SocialFeed fallback={socialFallback} />
      <Section id="trust" type="trust-badges" settings={{ heading: 'Shop with confidence' }} tight>
        <div className="page-width">
          <TrustBadges />
        </div>
      </Section>
      <FaqSection />
    </>
  );
}
