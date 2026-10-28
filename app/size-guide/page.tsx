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
      <div className="mt-6 overflow-x-auto">
        {SIZE_GUIDE.rows.length ? (
          <table className="w-full min-w-[420px] border-collapse text-left text-base">
            <thead><tr>{SIZE_GUIDE.columns.map((c) => <th key={c} scope="col" className="border-b-2 border-white/60 p-3">{c}</th>)}</tr></thead>
            <tbody>{SIZE_GUIDE.rows.map((r, i) => <tr key={i} className="border-b border-white/15">{r.map((c, j) => j === 0 ? <th key={j} scope="row" className="p-3">{c}</th> : <td key={j} className="p-3">{c}</td>)}</tr>)}</tbody>
          </table>
        ) : <Tbc label="Sizes and measurement chart" />}
      </div>
      <h2 className="mt-10 text-xl font-bold">How to measure</h2>
      <p className="mt-2"><Fact value={SIZE_GUIDE.howToMeasure} label="Measuring instructions" /></p>
      <h2 className="mt-10 text-xl font-bold">Intended fit</h2>
      <p className="mt-2"><Fact value={BASE_LAYER.intendedFit} label="Intended fit" /></p>
    </div>
  );
}
