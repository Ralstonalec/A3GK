import { useRef, useState } from 'react';
import data from '@/data/testimonials.json';
import Section from '@/components/layout/Section';
import FadeInSection from '@/components/animation/FadeInSection';
import Modal from '@/components/ui/Modal';
import SampleNote from '@/components/ui/SampleNote';
import { IconArrow, IconPlay } from '@/components/ui/Icons';
import styles from '@/styles/sections.module.css';

export const schema = { name: 'Testimonial videos', settings: ['eyebrow', 'heading'] };

function initials(name) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Scroll-snap carousel of testimonial cards. A card with a `videoSrc` shows a
 * play button that opens the video in an accessible modal; without footage it
 * is a quote card — no dead controls.
 */
export default function TestimonialCarousel() {
  const trackRef = useRef(null);
  const [video, setVideo] = useState(null);

  const scrollByCard = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('li');
    el.scrollBy({ left: dir * ((card?.offsetWidth || 320) + 24), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  return (
    <Section id="testimonials" type="testimonial-videos" settings={{ eyebrow: 'From the box', heading: 'Keepers on the gear' }} labelledBy="testimonials-heading">
      <div className="page-width">
        <FadeInSection className={styles.carouselHead}>
          <div className="stack">
            <p className="eyebrow">From the box</p>
            <h2 id="testimonials-heading">Keepers on the gear</h2>
            <SampleNote isSample={data.isSample}>Sample testimonials — replace with real, consented customers</SampleNote>
          </div>
          <div className={styles.carouselNav}>
            <button type="button" onClick={() => scrollByCard(-1)} aria-label="Previous testimonials"><IconArrow size={20} style={{ transform: 'scaleX(-1)' }} /></button>
            <button type="button" onClick={() => scrollByCard(1)} aria-label="Next testimonials"><IconArrow size={20} /></button>
          </div>
        </FadeInSection>

        <ul ref={trackRef} role="list" className={styles.carousel} aria-label="Customer testimonials" tabIndex={0}>
          {data.items.map((t) => (
            <li key={t.id} className={styles.testimonial}>
              <div className={styles.poster} style={{ '--poster-accent': t.accent }}>
                <span className={styles.posterInitials} aria-hidden="true">{initials(t.name)}</span>
                {t.videoSrc && (
                  <button type="button" className={styles.playButton} onClick={() => setVideo(t)} aria-label={`Play video testimonial from ${t.name}`}>
                    <IconPlay size={26} />
                  </button>
                )}
                <span className={styles.posterTag}>{t.videoSrc ? 'Video' : 'Quote'}</span>
              </div>
              <figure>
                <blockquote>“{t.quote}”</blockquote>
                <figcaption>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>

      <Modal open={Boolean(video)} onClose={() => setVideo(null)} title={video ? `${video.name} — ${video.role}` : 'Video'} size="lg">
        {video && (
          <video className={styles.modalVideo} src={video.videoSrc} poster={video.poster || undefined} controls autoPlay playsInline>
            Your browser does not support embedded video.
          </video>
        )}
      </Modal>
    </Section>
  );
}
