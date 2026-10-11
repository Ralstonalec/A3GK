import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { publicConfig, SITE } from '@/lib/config';
import { MEDIA } from '@/lib/media';
import { usePrefersReducedMotion } from '@/lib/hooks';
import ScrollLayer from '@/components/animation/ScrollLayer';
import Button from '@/components/ui/Button';
import Section from '@/components/layout/Section';
import { IconArrow, IconPause, IconPlay } from '@/components/ui/Icons';
import styles from '@/styles/sections.module.css';

/** Shopify theme-editor schema mirror — kept in sync with ShopifyTheme/sections/hero-section.liquid (tested). */
export const schema = {
  name: 'Hero',
  settings: ['eyebrow', 'heading', 'accent_word', 'subheading', 'primary_label', 'primary_link', 'secondary_label', 'secondary_link', 'video_url', 'overlay_opacity'],
};

export const heroDefaults = {
  eyebrow: SITE.tagline,
  heading: 'Own the',
  accent_word: 'line.',
  subheading: 'Padded base layers, goalkeeper jerseys, pants and shorts, athletic tape and grip socks.',
  primary_label: 'Shop gear',
  primary_link: '/products',
  secondary_label: 'Shop base layers',
  secondary_link: '/products?category=base-layers',
  video_url: '',
  overlay_opacity: 55,
};

/** Scroll window for the hero: 0 at the top of the page, 1 once the hero has scrolled fully out. */
const HERO_EXIT = ['start start', 'end start'];

/**
 * Full-bleed hero media: autoplaying video when a URL is configured
 * (NEXT_PUBLIC_HERO_VIDEO_URL or data/media.json), otherwise the hero photograph.
 * Video respects prefers-reduced-motion, pauses off-screen and has a visible pause control (WCAG 2.2.2).
 *
 * Parallax: the media layer drifts DOWN relative to the page as the hero scrolls
 * out, i.e. it moves slower than the content (depth). Scrubbed by scroll position,
 * so it reverses exactly when scrolling back up. The image is clipped by the hero
 * (overflow: hidden) and the revealed gap is always above the viewport, so no
 * edge is ever exposed.
 */
function HeroBackground({ videoUrl, poster, reduced, rootRef }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(!reduced);
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0 });
    io.observe(node);
    return () => io.disconnect();
  }, [rootRef]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing && onScreen) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [playing, onScreen]);

  return (
    <>
      <ScrollLayer target={rootRef} offset={HERO_EXIT} y={['0%', '14%']} className={styles.heroMedia}>
        <div className={styles.heroMediaInner} data-hero="media">
          {videoUrl ? (
            <video ref={videoRef} className={styles.heroVideo} src={videoUrl} poster={poster || undefined} muted loop playsInline preload="metadata" autoPlay={!reduced} aria-hidden="true" />
          ) : (
            <Image src={MEDIA.hero.image} alt={MEDIA.hero.imageAlt || ''} fill priority quality={75} sizes="100vw" className={styles.heroImage} />
          )}
        </div>
      </ScrollLayer>
      {/* Outside the moving layer so the control never drifts. */}
      {videoUrl && (
        <button type="button" className={styles.videoToggle} onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause background video' : 'Play background video'}>
          {playing ? <IconPause size={18} /> : <IconPlay size={18} />}
        </button>
      )}
    </>
  );
}

export default function HeroSection({ settings = {} }) {
  const s = { ...heroDefaults, ...settings };
  const reduced = usePrefersReducedMotion();
  const root = useRef(null);
  const videoUrl = s.video_url || publicConfig.heroVideoUrl || MEDIA.hero.videoUrl;
  const poster = publicConfig.heroVideoPoster || MEDIA.hero.videoPoster;

  /*
   * GSAP master timeline — progressive enhancement only. The headline is plain
   * server-rendered text (it is the LCP element); GSAP choreographs the rest:
   * accent underline sweep, grid draw-in and a slow Ken-Burns drift on the media.
   * Scroll-linked motion (parallax, content drift/fade) is handled separately by
   * <ScrollLayer> so there is a single scroll system. Text blocks use CSS
   * keyframes (no JS needed, no hidden-until-hydrated content).
   */
  useEffect(() => {
    if (reduced || !root.current) return undefined;
    let ctx;
    let cancelled = false;
    import('gsap').then(({ gsap }) => {
      if (cancelled) return;
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.fromTo('[data-hero="underline"]', { scaleX: 0 }, { scaleX: 1, duration: 1.1, transformOrigin: 'left center' }, 0.25).fromTo('[data-hero="gridline"]', { scaleY: 0 }, { scaleY: 1, duration: 1.4, stagger: 0.08, transformOrigin: 'top center' }, 0);

        // Ken-Burns drift, separate from the intro timeline so it can loop forever.
        gsap.fromTo('[data-hero="media"]', { scale: 1.03 }, { scale: 1.1, duration: 22, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      }, root);
    });
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduced]);

  return (
    <Section id="hero" type="hero-section" settings={s} className={styles.hero} labelledBy="hero-heading">
      <div ref={root} className={styles.heroInner}>
        <div className={styles.heroGrid} aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} data-hero="gridline" />
          ))}
        </div>

        <HeroBackground videoUrl={videoUrl} poster={poster} reduced={reduced} rootRef={root} />
        <div className={styles.heroOverlay} style={{ '--overlay': `${s.overlay_opacity / 100}` }} aria-hidden="true" />

        {/* Copy lifts and fades as the hero scrolls away — the counterpart to the slower media. */}
        <ScrollLayer target={root} offset={HERO_EXIT} input={[0, 0.75]} y={[0, -64]} opacity={[1, 0.1]} className={`page-width ${styles.heroContent}`}>
          <p className={`eyebrow ${styles.heroEyebrow}`}>{s.eyebrow}</p>
          <h1 id="hero-heading" className={`h-hero ${styles.heroTitle}`}>
            {s.heading}{' '}
            <span className={styles.heroAccent}>
              {s.accent_word}
              <i data-hero="underline" aria-hidden="true" />
            </span>
          </h1>
          <p className={`lead ${styles.heroLead}`}>{s.subheading}</p>
          <div className={`cluster ${styles.heroCtas}`}>
            <Button href={s.primary_link} size="lg" iconAfter={<IconArrow size={20} />}>
              {s.primary_label}
            </Button>
            <Button href={s.secondary_link} size="lg" variant="secondary">
              {s.secondary_label}
            </Button>
          </div>
        </ScrollLayer>
      </div>
    </Section>
  );
}
