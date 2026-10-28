import gsap from 'gsap';
import { stage, type View } from '@/lib/stage';

const THEME: Record<View, { inner: string; mid: string; outer: string }> = {
  set: { inner: '#59616b', mid: '#22262b', outer: '#07080a' },
  top: { inner: '#4a6279', mid: '#1b2631', outer: '#06090c' },
  legs: { inner: '#6a5f73', mid: '#27222c', outer: '#08070a' },
};

const blur = () => {
  if (stage.el && !window.matchMedia('(pointer: coarse)').matches) stage.el.style.filter = stage.fx.blur > 0.1 ? `blur(${stage.fx.blur}px)` : 'none';
};

/** Glide to the chosen view with a short focus pull and a tint change in the backdrop. */
export function installActions() {
  stage.requestView = (view) => {
    if (view === stage.view) return;
    stage.view = view;
    gsap.to(document.documentElement, { '--bg-inner': THEME[view].inner, '--bg-mid': THEME[view].mid, '--bg-outer': THEME[view].outer, duration: 1.4, ease: 'power2.inOut' });
    gsap.timeline({ onComplete: blur })
      .to(stage.fx, { blur: 7, duration: 0.25, ease: 'power2.out', onUpdate: blur })
      .to(stage.fx, { blur: 0, duration: 0.7, ease: 'power2.inOut', onUpdate: blur });
  };
}
