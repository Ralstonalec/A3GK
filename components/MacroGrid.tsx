import Image from 'next/image';
import { MACRO } from '@/lib/photos';

/** Real close-ups, shown at their native size so the quilting stays sharp. */
export function MacroGrid() {
  return (
    <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0 [scrollbar-width:thin]">
      {MACRO.map((m) => (
        <li key={m.id} className="glass flex w-[180px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl md:w-[200px]">
          <div className="flex flex-1 items-center justify-center bg-black/30 p-2">
            <Image src={m.src} alt={`Photograph: ${m.label}`} width={m.w} height={m.h} sizes="(min-width:768px) 22vw, 45vw" className="h-auto max-h-[200px] w-auto max-w-full object-contain" />
          </div>
          <p className="p-3 text-xs font-bold uppercase tracking-wider text-white/80">{m.label}</p>
        </li>
      ))}
    </ul>
  );
}
