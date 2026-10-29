import Image from 'next/image';

/** AI-generated scenery behind a section. Decorative (empty alt); place inside a `relative isolate` parent. */
export function SceneBackdrop({ scene, position = 'center', fade = 'both' }: { scene: { src: string; w: number; h: number }; position?: string; fade?: 'both' | 'bottom' }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[2rem]">
      <Image src={scene.src} alt="" width={scene.w} height={scene.h} sizes="100vw" className="h-full w-full object-cover" style={{ objectPosition: position }} />
      <div className={`absolute inset-0 bg-gradient-to-b ${fade === 'both' ? 'from-[#080a0e] via-[#080a0e]/25 to-[#080a0e]' : 'from-transparent via-[#080a0e]/20 to-[#080a0e]'}`} />
      <div className="absolute inset-0 bg-gradient-to-r from-[#080a0e]/60 via-transparent to-[#080a0e]/40" />
    </div>
  );
}
