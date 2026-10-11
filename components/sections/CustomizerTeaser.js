import Image from 'next/image';
import Section from '@/components/layout/Section';
import FadeInSection from '@/components/animation/FadeInSection';
import ScrollLayer from '@/components/animation/ScrollLayer';
import Button from '@/components/ui/Button';
import { MEDIA } from '@/lib/media';
import { IconArrow } from '@/components/ui/Icons';
import styles from '@/styles/sections.module.css';

export const schema = { name: 'Customizer teaser', settings: ['eyebrow', 'heading', 'cta_label'] };

export default function CustomizerTeaser() {
  return (
    <Section id="studio" type="customizer-teaser" settings={{ eyebrow: 'Design Studio', heading: 'Your colours. Your name. Your kit.', cta_label: 'Open the studio' }} labelledBy="studio-heading" className={styles.studioTeaser}>
      <div className={`page-width ${styles.studioGrid}`}>
        <FadeInSection className={styles.studioCopy}>
          <p className="eyebrow">Design Studio</p>
          <h2 id="studio-heading">Your colours. Your name. Your kit.</h2>
          <p className="lead">Build a one-of-a-kind padded jersey with a live preview and instant pricing. Upload a club crest, pick a font, save it and share it with your team, then order.</p>
          <ul role="list" className={styles.studioFeatures}>
            <li>Live preview, front &amp; back</li>
            <li>Custom hex colours, six patterns, three fabrics</li>
            <li>Logo upload with precise positioning</li>
          </ul>
          <Button href="/customizer" size="lg" iconAfter={<IconArrow size={20} />}>
            Open the studio
          </Button>
        </FadeInSection>
        <FadeInSection className={styles.studioPhoto} delay={0.12}>
          {/* Photo settles from a slight zoom to rest as it reaches mid-screen, then eases out again. */}
          <ScrollLayer className={styles.studioPhotoLayer} input={[0, 0.5, 1]} scale={[1.1, 1, 1.05]}>
            <Image src={MEDIA.studio.image} alt={MEDIA.studio.alt} width={1200} height={900} sizes="(min-width: 990px) 44vw, 92vw" />
          </ScrollLayer>
        </FadeInSection>
      </div>
    </Section>
  );
}
