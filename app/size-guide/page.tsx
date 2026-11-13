import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/motion/PageHero';
import { Reveal } from '@/components/Reveal';
import { Fact, Tbc } from '@/components/Tbc';
import { BASE_LAYER, HANDLES, SIZE_GUIDE } from '@/lib/content';

export const metadata: Metadata = { title: 'Size guide', description: 'Size charts and fit for the A3GK padded base layer: tops and leggings, with how to measure.' };

export default function SizeGuide() {
  return (
    <>
      <PageHero
        lines={['Find', 'your size']}
        band="Size guide"
        intro={<>Figures below are <strong>{SIZE_GUIDE.measurementType ? `${SIZE_GUIDE.measurementType} measurements` : <Tbc label="Body or garment measurements?" />}</strong>{SIZE_GUIDE.measurementType && ` in ${SIZE_GUIDE.unit}`}. <Fact value={BASE_LAYER.trueToSize} label="True to size" /></>}
      >
        <Link href={`/products/${HANDLES.base}`} className="btn-primary">Build your kit</Link>
      </PageHero>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-4">
        {SIZE_GUIDE.tables.length ? SIZE_GUIDE.tables.map((t) => (
          <Reveal key={t.title} className="mt-10">
            <h2 className="font-display text-4xl font-extrabold uppercase md:text-5xl">{t.title}</h2>
            <div className="mt-4 overflow-x-auto rounded-2xl bg-white/[0.05]">
              <table className="w-full min-w-[520px] border-collapse text-left text-base">
                <thead><tr>{t.columns.map((c) => <th key={c} scope="col" className="border-b border-white/25 p-4 text-sm font-semibold text-white/65">{c}</th>)}</tr></thead>
                <tbody>{t.rows.map((r, i) => <tr key={i} className="border-b border-white/10 transition-colors last:border-0 hover:bg-accent/10">{r.map((c, j) => j === 0 ? <th key={j} scope="row" className="p-4 font-display text-3xl font-extrabold text-accent">{c}</th> : <td key={j} className="p-4 text-lg">{c}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </Reveal>
        )) : <div className="mt-6"><Tbc label="Sizes and measurement chart" /></div>}
        {SIZE_GUIDE.tables.length > 0 && <p className="mt-4 text-sm text-white/70">{SIZE_GUIDE.tolerance} Weight and height columns are a recommended match. Leggings sizes L and XL, and the shorts chart: <Tbc label="Remaining size rows" /></p>}
        <div className="mt-16 grid gap-10 md:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold uppercase md:text-4xl">How to measure</h2>
            <p className="mt-3 text-lg text-white/85"><Fact value={SIZE_GUIDE.howToMeasure} label="Measuring instructions" /></p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display text-3xl font-extrabold uppercase md:text-4xl">Intended fit</h2>
            <p className="mt-3 text-lg text-white/85"><Fact value={BASE_LAYER.intendedFit} label="Intended fit" /></p>
          </Reveal>
        </div>
      </div>
    </>
  );
}
