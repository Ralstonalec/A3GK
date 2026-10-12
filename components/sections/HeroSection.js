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

/** Settings a Shopify theme-editor section would expose (the Liquid theme is not built yet). */
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
  // Derived, never seeded from the hydration-time media query: a reduced-motion visitor's video never starts.
  const [userChoice, setUserChoice] = useState(null);
  const playing = userChoice ?? !reduced;
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
    if (playing && onScreen) v.play().catch(() => setUserChoice(false));
    else v.pause();
  }, [playing, onScreen]);

  return (
    <>
      <ScrollLayer target={rootRef} offset={HERO_EXIT} y={['0%', '14%']} className={styles.heroMedia}>
        {/* Entrance: a clip-path curtain lifts while the frame settles from a slight zoom. Pure CSS so the
            first paint never waits for JavaScript and reduced motion shows the final frame at once. */}
        <div className={styles.heroReveal}>
          <div className={styles.heroSettle}>
            <div className={styles.heroMediaInner} data-hero="media">
              {videoUrl ? (
                <video ref={videoRef} className={styles.heroVideo} src={videoUrl} poster={poster || undefined} muted loop playsInline preload="metadata" aria-hidden="true" />
              ) : (
                <Image src={MEDIA.hero.image} alt={MEDIA.hero.imageAlt || ''} fill priority quality={75} sizes="100vw" className={styles.heroImage} />
              )}
            </div>
          </div>
        </div>
      </ScrollLayer>
      {/* Outside the moving layer so the control never drifts. */}
      {videoUrl && (
        <button type="button" className={styles.videoToggle} onClick={() => setUserChoice(!playing)} aria-label={playing ? 'Pause background video' : 'Play background video'}>
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
   * the decorative grid lines drawing in. The image curtain, headline lines and accent underline are CSS.
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
        // Decorative grid lines draw in. (Headline, image and underline are CSS-driven; nothing here is needed to read the page.)
        tl.fromTo('[data-hero="gridline"]', { scaleY: 0 }, { scaleY: 1, duration: 1.6, stagger: 0.12, transformOrigin: 'top center' }, 0.2);
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
          {[0, 1, 2].map((i) => (
            <span key={i} data-hero="gridline" />
          ))}
        </div>

        <HeroBackground videoUrl={videoUrl} poster={poster} reduced={reduced} rootRef={root} />
        <div className={styles.heroOverlay} style={{ '--overlay': `${s.overlay_opacity / 100}` }} aria-hidden="true" />

        {/* Copy lifts and fades as the hero scrolls away — the counterpart to the slower media. */}
        <ScrollLayer target={root} offset={HERO_EXIT} input={[0, 0.75]} y={[0, -64]} opacity={[1, 0.1]} className={`page-width ${styles.heroContent}`}>
          <p className={`eyebrow ${styles.heroEyebrow}`}>{s.eyebrow}</p>
          {/* Each line sits in its own mask and rises into it. The text stays plain, real heading text. */}
          <h1 id="hero-heading" className={`h-hero ${styles.heroTitle}`}>
            <span className={styles.heroLine}>
              <span className={styles.heroLineInner} style={{ '--line': 0 }}>{s.heading}</span>
            </span>{' '}
            <span className={styles.heroLine}>
              <span className={`${styles.heroLineInner} ${styles.heroAccent}`} style={{ '--line': 1 }}>
                {s.accent_word}
                <i data-hero="underline" aria-hidden="true" />
              </span>
            </span>
          </h1>
          <div className={styles.heroFoot}>
            <p className={`lead ${styles.heroLead}`}>{s.subheading}</p>
            <div className={`cluster ${styles.heroCtas}`}>
              <Button href={s.primary_link} size="lg" iconAfter={<IconArrow size={20} />}>
                {s.primary_label}
              </Button>
              <Button href={s.secondary_link} size="lg" variant="secondary">
                {s.secondary_label}
              </Button>
            </div>
          </div>
        </ScrollLayer>
      </div>
    </Section>
  );
}
