import Image from 'next/image';
import { RENDER } from '@/lib/photos';

/** Static display of the product rendering, always labelled as a rendering. */
export function RenderFigure({ priority = false, sizes, className = '' }: { priority?: boolean; sizes: string; className?: string }) {
  return (
    <figure className={className}>
      <Image src={RENDER.src} alt={RENDER.alt} width={RENDER.w} height={RENDER.h} priority={priority} sizes={sizes} className="h-auto w-full" />
      <figcaption className="mt-2 text-xs text-white/55">Rendering based on the real garments. Close-up photographs are below.</figcaption>
    </figure>
  );
}
