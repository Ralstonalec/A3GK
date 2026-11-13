import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PageHero } from '@/components/motion/PageHero';
import { ScrollWords } from '@/components/motion/ScrollWords';
import { Reveal } from '@/components/Reveal';
import { BRAND_INTRO, HANDLES } from '@/lib/content';
import { RENDER, SCENE } from '@/lib/photos';

export const metadata: Metadata = { title: 'About A3GK', description: BRAND_INTRO };

const DOORS = [
  { href: `/products/${HANDLES.base}`, title: 'Padded base layer', text: 'The centre of the range. See where it is padded and build your kit.', img: RENDER, pos: '22% 50%' },
  { href: '/team', title: 'Team orders', text: 'Kitting out a team or club? Tell us what you need.', img: SCENE.stadiumNight, pos: '50% 50%' },
  { href: '/club', title: 'A3 Goalkeepers Club', text: 'Hear first when new A3GK gear drops.', img: SCENE.pitchNight, pos: '50% 60%' },
];

export default function About() {
  return (
    <>
      <PageHero lines={['About', 'A3 Goalkeeping']} band="For keepers" scene={SCENE.grassLine} scenePosition="50% 70%" />
      <section className="mx-auto max-w-6xl px-4 py-20 md:py-32">
        <ScrollWords text={BRAND_INTRO} className="font-display text-[clamp(2rem,5.4vw,4.6rem)] font-extrabold uppercase leading-[1.02]" />
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-24" aria-label="Where to go next">
        <ul className="grid gap-4 md:grid-cols-3">
          {DOORS.map((d, i) => (
            <li key={d.href}>
              <Reveal delay={i * 0.09} className="h-full">
                <Link href={d.href} className="group relative flex h-full min-h-[320px] flex-col justify-end overflow-hidden rounded-3xl p-6">
                  <Image src={d.img.src} alt="" width={d.img.w} height={d.img.h} sizes="(min-width:768px) 33vw, 100vw" className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-700 group-hover:scale-105" style={{ objectPosition: d.pos }} />
                  <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-[#080a0e] via-[#080a0e]/55 to-transparent" />
                  <h2 className="font-display text-3xl font-extrabold uppercase leading-[0.95]">{d.title}</h2>
                  <p className="mt-2 text-white/80">{d.text}</p>
                  <span className="mt-3 font-semibold text-accent underline-offset-4 group-hover:underline">Go →</span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-white/50">Images are renderings.</p>
      </section>
    </>
  );
}
