import Image from 'next/image';
import Section from '@/components/layout/Section';
import FadeInSection from '@/components/animation/FadeInSection';
import ScrollLayer from '@/components/animation/ScrollLayer';
import Button from '@/components/ui/Button';
import { FEATURES } from '@/lib/features';
import { MEDIA } from '@/lib/media';
import { IconArrow } from '@/components/ui/Icons';
import styles from '@/styles/sections.module.css';

export const schema = { name: 'Customizer teaser', settings: ['eyebrow', 'heading', 'cta_label'] };

/** Custom kit is a work in progress: this section is hidden until NEXT_PUBLIC_FEATURE_CUSTOM_KIT is on (lib/features.js). */
export default function CustomizerTeaser() {
  if (!FEATURES.customKit) return null;

  return (
    <Section id="studio" type="customizer-teaser" settings={{ eyebrow: 'Custom kit', heading: 'Design your own kit', cta_label: 'Open the studio' }} labelledBy="studio-heading" className={styles.studioTeaser}>
      <div className={`page-width ${styles.studioGrid}`}>
        <FadeInSection className={styles.studioCopy}>
          <p className="eyebrow">Custom kit</p>
          <h2 id="studio-heading">Design your own kit</h2>
          <p className="lead">Choose colours, add a name and number and place your club logo, with a live preview and instant pricing.</p>
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
