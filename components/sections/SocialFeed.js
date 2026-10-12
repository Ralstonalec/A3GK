import Image from 'next/image';
import { SITE } from '@/lib/config';
import Section from '@/components/layout/Section';
import FadeInSection from '@/components/animation/FadeInSection';
import StaggeredList from '@/components/animation/StaggeredList';
import Button from '@/components/ui/Button';
import { IconInstagram } from '@/components/ui/Icons';
import styles from '@/styles/sections.module.css';

export const schema = { name: 'Social feed', settings: ['eyebrow', 'heading'] };

/**
 * Real Instagram posts only (lib/social.js, refreshed by ISR). With no
 * INSTAGRAM_ACCESS_TOKEN — or if Instagram is unreachable — `posts` is empty and
 * the whole section is omitted: there are no stand-in posts.
 */
export default function SocialFeed({ posts = [] }) {
  if (!posts.length) return null;

  return (
    <Section id="community" type="social-feed" settings={{ eyebrow: 'Instagram', heading: 'From our feed' }} labelledBy="community-heading">
      <div className="page-width">
        <FadeInSection className="section__header">
          <p className="eyebrow">Instagram</p>
          <h2 id="community-heading">From our feed</h2>
        </FadeInSection>

        <StaggeredList as="ul" itemAs="li" className={styles.socialGrid} role="list">
          {posts.slice(0, 6).map((post) => (
            <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer" className={styles.socialTile} aria-label={`${post.caption || 'Instagram post'} (opens in a new tab)`}>
              <Image src={post.image} alt="" width={400} height={400} sizes="(min-width: 990px) 16vw, (min-width: 750px) 33vw, 50vw" unoptimized={!/(cdninstagram|fbcdn)/.test(post.image)} />
              <span className={styles.socialOverlay}>
                <IconInstagram size={22} />
                <span>{post.caption}</span>
              </span>
            </a>
          ))}
        </StaggeredList>

        {SITE.social.instagram && (
          <div className={styles.sectionCta}>
            <Button href={SITE.social.instagram} variant="secondary" iconBefore={<IconInstagram size={18} />} target="_blank" rel="noopener noreferrer">
              Follow on Instagram
            </Button>
          </div>
        )}
      </div>
    </Section>
  );
}
