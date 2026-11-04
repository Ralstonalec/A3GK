import { Reveal } from './Reveal';
import { DiveDemo } from './DiveDemo';
import { SceneBackdrop } from './SceneBackdrop';
import { BASE_LAYER, PADDING_DESIGN, PRICING } from '@/lib/content';
import { SCENE } from '@/lib/photos';
import { TURF } from '@/lib/content';
import { Fact } from './Tbc';

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
          Artificial turf is now a normal place to play and train, and a goalkeeper lands on it again and again. Diving is the job, and the landing is the part that hurts.
        </p>
      </Reveal>

      <div className="mt-8 grid items-center gap-6 md:grid-cols-[340px_1fr] md:gap-10">
        <Reveal><DiveDemo /><p className="mt-2 text-center text-xs text-white/50">Illustrative demonstration.</p></Reveal>
        <div className="grid gap-8">
          <div>
            <p className="font-display text-4xl font-extrabold uppercase leading-[0.95] md:text-5xl">Thousands of fields across North America</p>
            <p className="mt-2 text-white/80">Artificial turf fields are installed at schools, colleges, parks and stadiums in the United States and Canada. <Fact value={TURF.fieldCount} label="Number of artificial turf fields in North America (source and year)" />.</p>
          </div>
          <div>
            <p className="font-display text-2xl font-extrabold uppercase">What a dive on turf can cost you</p>
            <ul className="mt-3 grid gap-4 text-lg text-white/80">
              <li><strong className="text-white">Abrasions.</strong> Scrapes and turf burn are what players most associate with artificial turf. A systematic review found players consistently see abrasion as a major drawback of the surface.</li>
              <li><strong className="text-white">Contact on every landing.</strong> Shoulder, ribs, elbow, hip and knee meet the surface, often one after another, and it adds up over every save, training and game.</li>
              <li><strong className="text-white">Goalkeeper-specific injuries.</strong> A study of adolescent goalkeepers reported more goalkeeping injuries on artificial turf than on natural grass, most often to the fingers and thigh muscles.</li>
            </ul>
          </div>
        </div>
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
      <p className="mt-10 max-w-3xl text-xs text-white/55">
        Field counts: <a className="underline underline-offset-4" href="https://www.nrpa.org/parks-recreation-magazine/2020/may/synthetic-turf-the-worlds-fastest-growing-play-surface/" target="_blank" rel="noopener noreferrer">NRPA</a> (Synthetic Turf Council estimate, US) and <a className="underline underline-offset-4" href="https://ncceh.ca/sites/default/files/2025-11/NCCEH%20Artificial%20Turf%202025%20Final%20Draft%20EN%2019NOV25%20FINAL_0.pdf" target="_blank" rel="noopener noreferrer">NCCEH</a> (Canada, public fields, 2022). Injuries: <a className="underline underline-offset-4" href="https://pubmed.ncbi.nlm.nih.gov/30503328/" target="_blank" rel="noopener noreferrer">Abrasion injuries on artificial turf: a systematic review</a> (2019);{' '}
        <a className="underline underline-offset-4" href="https://lida.sport-iat.de/dfb/Record/4054804" target="_blank" rel="noopener noreferrer">Characteristics of goalkeeping injuries: a retrospective, self-reported study in adolescent soccer players</a>.
        Across all soccer players, a 2023 <a className="underline underline-offset-4" href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10139885/" target="_blank" rel="noopener noreferrer">meta-analysis</a> found overall injury rates were lower on artificial turf than on grass, so the picture is mixed.
      </p>
    </section>
  );
}
