import { Reveal } from './Reveal';
import { TurfScene } from './TurfScene';
import { SceneBackdrop } from './SceneBackdrop';
import { BASE_LAYER, PADDING_DESIGN, PRICING } from '@/lib/content';
import { SCENE } from '@/lib/photos';

const STEPS = [
  { n: '01', t: 'Dive', d: 'You commit to the ball and leave your feet.' },
  { n: '02', t: 'Land', d: 'Shoulder, ribs, elbow, hip and knee meet the surface, often one after another.' },
  { n: '03', t: 'Repeat', d: 'Every save, every training, every game. The knocks add up.' },
];

/** The facts that used to sit in "What it is" and the fact strip, each pointing at the part of the page it belongs to. */
const FACTS = [
  { k: 'Padding', v: 'Hexagonal EVA foam, front only', cta: 'See the tour', href: '#tour' },
  { k: 'Fabric', v: BASE_LAYER.fabricComposition ?? '', cta: 'Close-ups', href: '#closeups' },
  { k: 'Fit', v: 'Tight to your body', cta: 'Size guide', href: '/size-guide' },
  { k: 'Sold', v: `Each piece alone, or any combination. $${PRICING.piece} each, $${PRICING.bundle} for a top and bottom (CAD)`, cta: 'Build your kit', href: '#buy' },
];

/** The reason the product exists. Claims are limited to what is true: where the padding is, what it is made of, how it fits. No injury-prevention claims. */
export function TurfProblem() {
  return (
    <section className="section relative isolate !py-14 md:!py-20" aria-labelledby="turf">
      <SceneBackdrop scene={SCENE.pitchNight} position="50% 55%" />
      <Reveal>
        <p className="eyebrow">The turf problem</p>
        <h2 id="turf" className="h2 max-w-3xl text-4xl md:text-6xl">Turf does not forgive a dive.</h2>
        <p className="mt-5 max-w-2xl text-lg text-white/80">
          Artificial turf can be harder and rougher than natural grass, and a goalkeeper meets it again and again. Diving is the job, and the landing is the part that hurts.
        </p>
      </Reveal>

      <TurfScene />

      <ol className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/15 md:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="bg-[#0c0f14]/90 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">{s.n} · {s.t}</p>
            <p className="mt-1 text-sm text-white/75">{s.d}</p>
          </li>
        ))}
      </ol>

      <Reveal className="mt-8 rounded-[2rem] border border-accent/40 bg-accent/[0.07] p-6 md:p-8">
        <div className="grid items-start gap-6 md:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">How A3GK helps</p>
            <h3 className="mt-2 font-display text-3xl font-extrabold uppercase leading-[0.95] md:text-4xl">Padding where you land.</h3>
            <p className="mt-3 text-white/85">
              Hexagonal EVA foam padding sits over the areas that take contact when you dive. It goes on under your kit and moves with you.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[PADDING_DESIGN.spread, PADDING_DESIGN.flex].map((d, i) => (
                <div key={d.title} className="rounded-2xl border border-accent/30 bg-black/35 p-4">
                  <svg width="34" height="34" viewBox="0 0 40 40" fill="none" stroke="#c8ff3d" strokeWidth="2" aria-hidden>
                    {i === 0
                      ? <><path d="M20 4l7 4v8l-7 4-7-4V8z" /><path d="M20 20l7 4v8l-7 4-7-4v-8z" opacity=".5" /><path d="M6 20l-3-2M34 20l3-2" opacity=".6" /></>
                      : <><path d="M6 28c6-14 22-14 28 0" /><path d="M12 28l3-3 3 3 3-3 3 3 3-3" opacity=".6" /></>}
                  </svg>
                  <h4 className="mt-2 font-display text-xl font-extrabold uppercase">{d.title}</h4>
                  <p className="mt-1 text-sm text-white/75">{d.body}</p>
                </div>
              ))}
            </div>
            <a href="#tour" className="btn-primary mt-5 inline-flex">See where it sits ↓</a>
            <p className="mt-4 text-sm text-white/60">Padding adds cushioning. It does not make you injury-proof, and it is not a substitute for good technique or proper equipment.</p>
          </div>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {BASE_LAYER.paddedAreas.map((p) => (
              <li key={p.id} className="rounded-2xl border border-white/15 bg-black/30 px-3 py-2.5 font-semibold">{p.label}</li>
            ))}
          </ul>
        </div>

        <dl className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/15 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map((f) => (
            <a key={f.k} href={f.href} className="group bg-[#0c0f14]/90 p-4 transition hover:bg-[#12161d]">
              <dt className="text-[11px] font-bold uppercase tracking-widest text-white/55">{f.k}</dt>
              <dd className="mt-1 font-semibold text-white">{f.v}</dd>
              <span className="mt-2 inline-block text-xs font-semibold text-accent underline-offset-4 group-hover:underline">{f.cta} →</span>
            </a>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}
