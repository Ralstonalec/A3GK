import gsap from 'gsap';
import { stage, type Mode, type View } from '@/lib/stage';

const THEME: Record<View, { inner: string; mid: string; outer: string }> = {
  set: { inner: '#59616b', mid: '#22262b', outer: '#07080a' },
  top: { inner: '#4a6279', mid: '#1b2631', outer: '#06090c' },
  legs: { inner: '#6a5f73', mid: '#27222c', outer: '#08070a' },
};

export function setTheme(view: View, duration = 1.5) {
  gsap.to(document.documentElement, { '--bg-inner': THEME[view].inner, '--bg-mid': THEME[view].mid, '--bg-outer': THEME[view].outer, duration, ease: 'power2.inOut' });
}

const blur = () => {
  if (stage.el) stage.el.style.filter = stage.fx.blur > 0.1 ? `blur(${stage.fx.blur}px)` : 'none';
};

/** Spin 720° with motion blur, implode the loose cells to centre, swap at the peak, explode back out. */
export function installActions() {
  stage.requestView = (view) => {
    if (stage.switching || view === stage.view) return;
    stage.switching = true;
    setTheme(view);
    const fx = stage.fx;
    gsap.timeline({ onComplete: () => { stage.switching = false; fx.spin = 0; blur(); } })
      .to(fx, { spin: Math.PI * 2, blur: 14, duration: 0.6, ease: 'power2.in', onUpdate: blur })
      .add(() => { stage.view = view; stage.reshuffle++; })
      .to(fx, { spin: Math.PI * 4, blur: 0, duration: 1.4, ease: 'back.out(0.7)', onUpdate: blur });
    gsap.timeline()
      .to(fx, { implode: 1, duration: 0.5, ease: 'power2.in' })
      .to(fx, { duration: 0.3 })
      .to(fx, { implode: 0, duration: 0.9, ease: 'back.out(1.5)' });
  };
  stage.requestMode = (mode: Mode) => {
    if (stage.switching || mode === stage.mode) return;
    stage.switching = true;
    const fx = stage.fx;
    gsap.timeline({ onComplete: () => { stage.switching = false; fx.spin = 0; blur(); } })
      .to(fx, { spin: Math.PI * 2, blur: 14, duration: 0.6, ease: 'power2.in', onUpdate: blur })
      .add(() => { stage.mode = mode; window.dispatchEvent(new Event('stage-mode')); })
      .to(fx, { spin: Math.PI * 4, blur: 0, duration: 1.4, ease: 'back.out(0.7)', onUpdate: blur });
  };
}
