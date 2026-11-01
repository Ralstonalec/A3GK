import type { Metadata } from 'next';
import { Fact, Tbc } from '@/components/Tbc';
import { BASE_LAYER, SIZE_GUIDE } from '@/lib/content';

export const metadata: Metadata = { title: 'Size guide' };

export default function SizeGuide() {
  return (
    <div className="section max-w-3xl">
      <h1 className="h2">Size guide</h1>
      <p className="mt-4">
        Figures below are{' '}
        <strong>{SIZE_GUIDE.measurementType ? `${SIZE_GUIDE.measurementType} measurements` : <Tbc label="Body or garment measurements?" />}</strong>
        {SIZE_GUIDE.measurementType && ` in ${SIZE_GUIDE.unit}`}.
      </p>
      {SIZE_GUIDE.tables.length ? SIZE_GUIDE.tables.map((t) => (
        <div key={t.title} className="mt-8 overflow-x-auto">
          <h2 className="mb-2 text-xl font-bold">{t.title}</h2>
          <table className="w-full min-w-[480px] border-collapse text-left text-base">
            <thead><tr>{t.columns.map((c) => <th key={c} scope="col" className="border-b-2 border-white/60 p-3">{c}</th>)}</tr></thead>
            <tbody>{t.rows.map((r, i) => <tr key={i} className="border-b border-white/15">{r.map((c, j) => j === 0 ? <th key={j} scope="row" className="p-3">{c}</th> : <td key={j} className="p-3">{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )) : <div className="mt-6"><Tbc label="Sizes and measurement chart" /></div>}
      {SIZE_GUIDE.tables.length > 0 && <p className="mt-4 text-sm text-white/70">{SIZE_GUIDE.tolerance} Weight and height columns are a recommended match. Leggings sizes L and XL, and the shorts chart: <Tbc label="Remaining size rows" /></p>}
      <h2 className="mt-10 text-xl font-bold">How to measure</h2>
      <p className="mt-2"><Fact value={SIZE_GUIDE.howToMeasure} label="Measuring instructions" /></p>
      <h2 className="mt-10 text-xl font-bold">Intended fit</h2>
      <p className="mt-2"><Fact value={BASE_LAYER.intendedFit} label="Intended fit" /></p>
    </div>
  );
}
