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

/** Numbered reference marker that jumps to the matching entry in the sources list below. */
const Cite = ({ n }: { n: number[] }) => (
  <sup className="ml-0.5 text-xs">{n.map((i) => <a key={i} href={`#src-${i}`} aria-label={`Source ${i}`} className="px-0.5 font-semibold text-accent underline-offset-2 hover:underline">[{i}]</a>)}</sup>
);

const SOURCES: { title: string; note: string; href: string }[] = [
  { title: 'Good Morning America (ABC News), report on the safety of synthetic turf', note: 'Synthetic Turf Council estimate of 12,000 to 13,000 synthetic turf sports fields in the United States.', href: 'https://goodmorningamerica.com/news/story/debate-safety-synthetic-turf-forever-chemicals-raises-concerns-108274911' },
  { title: 'School Construction News, "Five Questions to Ask Before Selecting Your Synthetic Turf"', note: 'The same Synthetic Turf Council estimate.', href: 'https://schoolconstructionnews.com/?p=48349' },
  { title: 'National Collaborating Centre for Environmental Health, "Artificial turf playing fields: A review of the evidence on health risks and environmental concerns" (November 2025)', note: '681 public artificial turf fields in Canada, based on available data (private fields not counted). Also notes that some studies show abrasions are more common on artificial turf than on natural turf.', href: 'https://ncceh.ca/resources/evidence-reviews/artificial-turf-playing-fields-review-evidence-health-risks-and' },
  { title: '"Abrasion injuries on artificial turf: A systematic review" (2019)', note: 'Players consistently see abrasion as a major drawback of artificial turf; study results on how often it happens vary.', href: 'https://pubmed.ncbi.nlm.nih.gov/30503328/' },
  { title: 'New York State Department of Health, "Information About Crumb-Rubber Infilled Synthetic Turf Athletic Fields"', note: 'Injury studies have not consistently found differences in abrasion risk between natural and synthetic turf; some synthetic turf, such as older nylon-fibre turf, is more abrasive.', href: 'https://healthweb-back.health.ny.gov/environmental/outdoors/synthetic_turf/crumb-rubber_infilled/fact_sheet.htm' },
  { title: 'Begier et al., Clinical Infectious Diseases 2004;39(10):1446, MRSA outbreak among college football players', note: 'Turf-burn abrasions were associated with skin infection; the authors concluded spread was between players, not directly from the turf.', href: 'https://academic.oup.com/cid/article/39/10/1446/321864' },
  { title: 'Science News, "There\u2019s the Rub: Football abrasions can lead to nasty infections"', note: 'A plain-language report on turf burns and skin infection in football players.', href: 'https://sciencenews.org/?p=37382' },
  { title: '"Shoulder injuries in professional football: a comparison between goalkeepers and outfield players"', note: 'In goalkeepers, 70% of shoulder injuries came from landing on the ground while diving with the arm fully extended, and 20% from collisions.', href: 'https://shoulderdoc.co.uk/article/1487' },
  { title: '"Biomechanical loading of the hip during side jumps by soccer goalkeepers"', note: 'Measures the load on a goalkeeper\u2019s hip when landing from a side jump; goalkeepers who roll as they land reduce it.', href: 'https://lida.sport-iat.de/ta/Record/4017954?lng=en' },
  { title: '"Incidence of football injuries sustained on artificial turf compared to grass and other playing surfaces: a systematic review and meta-analysis" (2023)', note: 'Across all soccer players, overall injury incidence was lower on artificial turf than on grass. It covers players generally, not goalkeepers.', href: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10139885/' },
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
            <p className="mt-2 text-white/80">Artificial turf fields are installed at schools, colleges, parks and stadiums in the United States and Canada. <Fact value={TURF.fieldCount} label="Number of artificial turf fields in North America (source and year)" />.<Cite n={[1, 2, 3]} /></p>
          </div>
          <div>
            <p className="font-display text-2xl font-extrabold uppercase">What a dive on turf can cost you</p>
            <div className="mt-3 grid gap-6 text-lg text-white/80">
              <div>
                <p className="font-semibold text-white">Abrasions</p>
                <p className="mt-1">Sliding and landing on artificial turf can scrape skin, and it is the injury players most associate with the surface. A systematic review found players consistently see abrasion as a major drawback of artificial turf.<Cite n={[4]} /> Some studies find abrasions more common on artificial turf than on natural grass,<Cite n={[3]} /> but the research is mixed, and some older turf fibres are more abrasive than others.<Cite n={[5]} /></p>
                <p className="mt-2">A scrape can be more than a scrape. In outbreak studies of college football players, turf burns were linked to skin infections, spread mainly from player to player rather than from the turf itself.<Cite n={[6, 7]} /></p>
              </div>
              <div>
                <p className="font-semibold text-white">Impact from landing</p>
                <p className="mt-1">A dive ends with your body meeting the ground, one area after another, and it adds up over every save, training and game. In a study of professional footballers, 70% of goalkeepers&rsquo; shoulder injuries came from landing on the ground while diving with the arm fully extended.<Cite n={[8]} /> Researchers have also measured how much load a goalkeeper&rsquo;s hip takes on a side-jump landing, and landing technique changes it.<Cite n={[9]} /></p>
              </div>
              <p className="text-base text-white/65">Across all soccer players, overall injury rates were lower on artificial turf than on grass, so the picture is mixed.<Cite n={[10]} /></p>
            </div>
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
      <div className="mt-10 max-w-3xl text-xs text-white/60">
        <p className="font-semibold text-white/70">Sources</p>
        <ol className="mt-2 grid gap-1.5">
          {SOURCES.map((x, i) => (
            <li key={x.href} id={`src-${i + 1}`} className="scroll-mt-28">
              [{i + 1}] <a className="underline underline-offset-4" href={x.href} target="_blank" rel="noopener noreferrer">{x.title}</a>. {x.note}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
