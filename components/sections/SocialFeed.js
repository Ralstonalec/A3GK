import Image from 'next/image';
import useSWR from 'swr';
import { apiUrl, SITE } from '@/lib/config';
import Section from '@/components/layout/Section';
import FadeInSection from '@/components/animation/FadeInSection';
import StaggeredList from '@/components/animation/StaggeredList';
import SampleNote from '@/components/ui/SampleNote';
import Button from '@/components/ui/Button';
import { IconInstagram } from '@/components/ui/Icons';
import styles from '@/styles/sections.module.css';

export const schema = { name: 'Social feed', settings: ['eyebrow', 'heading', 'handle'] };

const fetcher = (url) => fetch(url).then((r) => {
  if (!r.ok) throw new Error('feed');
  return r.json();
});

/** Live social feed: SWR polls /api/social every 5 min (Instagram Graph API when a token is set). */
export default function SocialFeed({ fallback }) {
  const { data } = useSWR(apiUrl('/social'), fetcher, { fallbackData: fallback, refreshInterval: 5 * 60 * 1000, revalidateOnFocus: false });
  const posts = data?.posts || [];

  return (
    <Section id="community" type="social-feed" settings={{ eyebrow: 'Community', heading: 'Seen on the pitch', handle: '@a3gk' }} labelledBy="community-heading">
      <div className="page-width">
        <FadeInSection className={`section__header ${styles.socialHead}`}>
          <p className="eyebrow">
            Community <span className={styles.liveDot} aria-hidden="true" />
            <span className="visually-hidden">live feed</span>
          </p>
          <h2 id="community-heading">Seen on the pitch</h2>
          <SampleNote isSample={data?.isSample}>Sample posts — connect Instagram to show your own</SampleNote>
        </FadeInSection>

        <StaggeredList as="ul" itemAs="li" className={styles.socialGrid} role="list">
          {posts.slice(0, 6).map((post) => (
            <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer" className={styles.socialTile} aria-label={`${post.caption || 'Instagram post'} (opens in a new tab)`}>
              <Image src={post.image} alt="" width={400} height={400} sizes="(min-width: 990px) 16vw, (min-width: 750px) 33vw, 50vw" unoptimized={post.image.startsWith('http') && !/(cdninstagram|fbcdn)/.test(post.image)} />
              <span className={styles.socialOverlay}>
                <IconInstagram size={22} />
                <span>{post.caption}</span>
              </span>
            </a>
          ))}
        </StaggeredList>

        <div className={styles.sectionCta}>
          <Button href={SITE.social.instagram} variant="secondary" iconBefore={<IconInstagram size={18} />} target="_blank" rel="noopener noreferrer">
            Follow @a3gk
          </Button>
        </div>
      </div>
    </Section>
  );
}
