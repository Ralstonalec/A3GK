import type { Metadata } from 'next';
import { BRAND_INTRO } from '@/lib/content';

export const metadata: Metadata = { title: 'About A3GK' };

export default function About() {
  return (
    <div className="section max-w-3xl">
      <h1 className="h2">About A3GK</h1>
      <p className="mt-6 text-lg">{BRAND_INTRO}</p>
    </div>
  );
}
