import { Reveal } from './Reveal';
import { SceneBackdrop } from './SceneBackdrop';
import { BASE_LAYER } from '@/lib/content';
import { SCENE } from '@/lib/photos';

const STEPS = [
  { n: '01', t: 'Dive', d: 'You commit to the ball and leave your feet.' },
  { n: '02', t: 'Land', d: 'Shoulder, ribs, elbow, hip and knee meet the surface, often one after another.' },
  { n: '03', t: 'Repeat', d: 'Every save, every training, every game. The knocks add up.' },
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

      <ol className="mt-8 grid gap-3 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.n}>
            <Reveal delay={i * 0.08} className="glass h-full rounded-3xl p-5">
              <p className="font-display text-5xl font-extrabold text-accent">{s.n}</p>
              <h3 className="mt-3 font-display text-2xl font-extrabold uppercase">{s.t}</h3>
              <p className="mt-1 text-white/75">{s.d}</p>
            </Reveal>
          </li>
        ))}
      </ol>

      <Reveal className="mt-8 grid items-start gap-6 rounded-[2rem] border border-accent/40 bg-accent/[0.07] p-6 md:grid-cols-[1.1fr_1fr] md:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">How A3GK helps</p>
          <h3 className="mt-2 font-display text-3xl font-extrabold uppercase leading-[0.95] md:text-4xl">Padding where you land.</h3>
          <p className="mt-3 text-white/85">
            The A3GK base layer adds EVA foam padding over the areas that take contact when you dive. It is made of {BASE_LAYER.fabricComposition ?? 'performance fabric'}, designed to fit tight to your body, and the padding moves with you, so it stays where you need it under your kit.
          </p>
          <p className="mt-3 text-sm text-white/60">Padding adds cushioning. It does not make you injury-proof, and it is not a substitute for good technique or proper equipment.</p>
        </div>
        <ul className="grid grid-cols-2 gap-2 text-sm">
          {BASE_LAYER.paddedAreas.map((p) => (
            <li key={p.id} className="rounded-2xl border border-white/15 bg-black/30 px-3 py-2.5 font-semibold">{p.label}</li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
