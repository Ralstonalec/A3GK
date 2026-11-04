import { Reveal } from './Reveal';
import { DiveDemo } from './DiveDemo';
import { SceneBackdrop } from './SceneBackdrop';
import { BASE_LAYER, PADDING_DESIGN, PRICING } from '@/lib/content';
import { SCENE } from '@/lib/photos';

const STEPS = [
  { t: 'Dive', d: 'You commit to the ball and leave your feet.' },
  { t: 'Land', d: 'Shoulder, ribs, elbow, hip and knee meet the surface, often one after another.' },
  { t: 'Repeat', d: 'Every save, every training, every game. The knocks add up.' },
];

/** The facts that used to sit in "What it is" and the fact strip, each pointing at the part of the page it belongs to. */
const FACTS = [
  { k: 'Padding', v: 'Hexagonal EVA foam, front only', cta: 'See the tour', href: '#tour' },
  { k: 'Fabric', v: BASE_LAYER.fabricComposition ?? '', cta: 'Close-ups', href: '/products/padded-base-layer' },
  { k: 'Fit', v: 'Tight to your body', cta: 'Size guide', href: '/size-guide' },
  { k: 'Sold', v: `Each piece alone, or any combination. $${PRICING.piece} each, $${PRICING.bundle} for a top and bottom (CAD)`, cta: 'Choose pieces', href: '#pieces' },
];

/** The reason the product exists. Claims are limited to what is true: where the padding is, what it is made of, how it fits. No injury-prevention claims. */
export function TurfProblem() {
  return (
    <section className="section relative isolate !py-14 md:!py-20" aria-labelledby="turf">
      <SceneBackdrop scene={SCENE.pitchNight} position="50% 55%" />
      <Reveal>
        <h2 id="turf" className="h2 max-w-3xl text-4xl md:text-6xl">Turf does not forgive a dive</h2>
        <p className="mt-5 max-w-2xl text-lg text-white/80">
          Artificial turf can be harder and rougher than natural grass, and a goalkeeper meets it again and again. Diving is the job, and the landing is the part that hurts.
        </p>
      </Reveal>

      <div className="mt-8 grid items-center gap-6 md:grid-cols-[340px_1fr] md:gap-10">
        <Reveal><DiveDemo /><p className="mt-2 text-center text-xs text-white/50">Illustrative demonstration.</p></Reveal>
        <ol className="grid gap-6">
          {STEPS.map((s, i) => (
            <li key={s.t}>
              <Reveal delay={i * 0.08}>
                <p className="font-display text-2xl font-extrabold uppercase">{s.t}</p>
                <p className="mt-1 text-lg text-white/80">{s.d}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>

      <Reveal className="mt-16">
        <div className="grid items-start gap-8 md:grid-cols-[1.1fr_1fr]">
          <div>
            <h3 className="font-display text-3xl font-extrabold uppercase leading-[0.95] md:text-5xl">Padding where you land</h3>
            <p className="mt-4 max-w-xl text-lg text-white/85">
              Hexagonal EVA foam padding sits over the areas that take contact when you dive. It goes on under your kit and moves with you.
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {[PADDING_DESIGN.spread, PADDING_DESIGN.flex].map((d) => (
                <div key={d.title}>
                  <h4 className="font-display text-xl font-extrabold uppercase">{d.title}</h4>
                  <p className="mt-1 text-white/75">{d.body}</p>
                </div>
              ))}
            </div>
            <a href="#tour" className="btn-primary mt-8 inline-flex">See where it sits ↓</a>
            <p className="mt-4 max-w-xl text-sm text-white/60">Padding adds cushioning. It does not make you injury-proof, and it is not a substitute for good technique or proper equipment.</p>
          </div>
          <div>
            <p className="font-semibold text-white/60">Padded areas</p>
            <p className="mt-2 text-xl font-semibold leading-relaxed">{BASE_LAYER.paddedAreas.map((p) => p.label).join(', ')}</p>
          </div>
        </div>

        <dl className="mt-12 grid gap-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map((f) => (
            <a key={f.k} href={f.href} className="group block">
              <dt className="font-semibold text-white/55">{f.k}</dt>
              <dd className="mt-1 text-base font-semibold text-white">{f.v}</dd>
              <span className="mt-2 inline-block font-semibold text-accent underline-offset-4 group-hover:underline">{f.cta} →</span>
            </a>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}
