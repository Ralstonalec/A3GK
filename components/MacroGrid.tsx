import Image from 'next/image';
import { MACRO } from '@/lib/photos';

/** Real close-ups, shown at their native size so the quilting stays sharp. */
export function MacroGrid() {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {MACRO.map((m) => (
        <li key={m.id} className="glass flex flex-col overflow-hidden rounded-2xl">
          <div className="flex flex-1 items-center justify-center bg-black/30 p-2">
            <Image src={m.src} alt={`Photograph: ${m.label}`} width={m.w} height={m.h} sizes="(min-width:768px) 22vw, 45vw" className="h-auto max-h-[260px] w-auto max-w-full object-contain" />
          </div>
          <p className="p-3 text-xs font-bold uppercase tracking-wider text-white/80">{m.label}</p>
        </li>
      ))}
    </ul>
  );
}
